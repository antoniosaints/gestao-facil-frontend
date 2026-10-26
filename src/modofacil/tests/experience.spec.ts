import { describe, it, expect, vi, beforeEach } from 'vitest'
const config = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../adapters/configuration', () => ({ configurationApi: config }))
import { experience, refreshExperience } from '../application/experience'
beforeEach(() => {
  localStorage.clear()
  experience.configuration = null
  experience.error = ''
  experience.dirty = false
  experience.changed = false
  vi.clearAllMocks()
})
describe('preferência remota', () => {
  it('não transforma falha em Normal e isola mudança de conta/sessão', async () => {
    localStorage.setItem('gestao_facil:token', 'conta-a')
    config.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 1, podeAlterar: true })
    await refreshExperience()
    expect(experience.configuration?.modo).toBe('FACIL')
    localStorage.setItem('gestao_facil:token', 'conta-b')
    config.get.mockRejectedValueOnce(new Error('offline'))
    await refreshExperience()
    expect(experience.configuration).toBe(null)
    expect(experience.error).toContain('offline')
  })
  it('avisa uma mudança remota sem limpar a operação em andamento', async () => {
    localStorage.setItem('gestao_facil:token', 'conta-c')
    config.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 1, podeAlterar: true })
    await refreshExperience()
    experience.dirty = true
    config.get.mockResolvedValueOnce({ modo: 'NORMAL', versao: 2, podeAlterar: true })
    await refreshExperience()
    expect(experience.changed).toBe(true)
    expect(experience.dirty).toBe(true)
  })
})

describe('inicialização e concorrência da preferência', () => {
  it('compartilha a leitura pendente e recupera uma inicialização sem preferência', async () => {
    localStorage.setItem('gestao_facil:token', 'inicializacao')
    let resolve!: (value: unknown) => void
    config.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const first = refreshExperience()
    const second = refreshExperience()
    expect(experience.loading).toBe(true)
    expect(experience.configuration).toBe(null)
    expect(config.get).toHaveBeenCalledOnce()
    resolve({ modo: 'FACIL', versao: 1, podeAlterar: true })
    await Promise.all([first, second])
    expect(experience.configuration?.modo).toBe('FACIL')
    expect(experience.loading).toBe(false)
  })
  it('ignora a resposta de uma sessão encerrada mesmo ao voltar para o mesmo token', async () => {
    localStorage.setItem('gestao_facil:token', 'sessao-antiga')
    let resolveOld!: (value: unknown) => void
    config.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolveOld = done
        }),
    )
    const oldRequest = refreshExperience()
    localStorage.removeItem('gestao_facil:token')
    await refreshExperience()
    expect(experience.loading).toBe(false)
    localStorage.setItem('gestao_facil:token', 'sessao-antiga')
    config.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 2, podeAlterar: true })
    await refreshExperience()
    resolveOld({ modo: 'NORMAL', versao: 1, podeAlterar: true })
    await oldRequest
    expect(experience.configuration).toEqual({ modo: 'FACIL', versao: 2, podeAlterar: true })
  })
  it('preserva a preferência válida se uma atualização falhar e permite repetir a leitura', async () => {
    localStorage.setItem('gestao_facil:token', 'reconexao')
    config.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 1, podeAlterar: true })
    await refreshExperience()
    config.get.mockRejectedValueOnce(new Error('offline'))
    await refreshExperience()
    expect(experience.configuration?.modo).toBe('FACIL')
    config.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 2, podeAlterar: true })
    await refreshExperience()
    expect(experience.error).toBe('')
    expect(experience.configuration?.versao).toBe(2)
  })
})

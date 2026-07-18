<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertCircle, ArrowLeft, FileText, Mail, Printer, ShieldCheck } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type LegalTab = 'termos' | 'privacidade'

const activeTab = ref<LegalTab>('termos')
const updatedAt = '18 de julho de 2026'

const termsIndex = [
  ['termos-objeto', 'Objeto e aceitação'],
  ['termos-conta', 'Cadastro e segurança'],
  ['termos-servicos', 'Serviços e limitações'],
  ['termos-dados', 'Dados e LGPD'],
  ['termos-pagamentos', 'Planos e pagamentos'],
  ['termos-integracoes', 'Integrações, WhatsApp e IA'],
  ['termos-uso', 'Uso permitido e proibido'],
  ['termos-cancelamento', 'Suspensão e cancelamento'],
  ['termos-responsabilidade', 'Responsabilidades'],
  ['termos-gerais', 'Disposições gerais'],
]

const privacyIndex = [
  ['privacidade-papeis', 'Papéis na LGPD'],
  ['privacidade-dados', 'Dados tratados'],
  ['privacidade-finalidades', 'Finalidades e bases legais'],
  ['privacidade-compartilhamento', 'Compartilhamento'],
  ['privacidade-cookies', 'Cookies e armazenamento local'],
  ['privacidade-retencao', 'Retenção e eliminação'],
  ['privacidade-seguranca', 'Segurança e incidentes'],
  ['privacidade-direitos', 'Direitos dos titulares'],
  ['privacidade-contato', 'Contato'],
]

function tabFromHash(): LegalTab {
  return window.location.hash === '#privacidade' ? 'privacidade' : 'termos'
}

function changeTab(value: string | number) {
  const tab: LegalTab = value === 'privacidade' ? 'privacidade' : 'termos'
  activeTab.value = tab
  window.history.replaceState(null, '', `#${tab}`)
}

function printDocument() {
  window.print()
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

onMounted(() => {
  activeTab.value = tabFromHash()
})
</script>

<template>
  <div class="min-h-screen bg-muted/20 text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <RouterLink to="/site" class="flex items-center gap-2" aria-label="Gestão Fácil — página inicial">
          <img src="/imgs/logo.png" alt="" class="h-8 w-8 rounded-lg object-contain" />
          <span class="text-lg font-bold tracking-tight sm:text-xl">Gestão Fácil</span>
        </RouterLink>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" class="hidden sm:inline-flex" @click="printDocument">
            <Printer class="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <RouterLink to="/site">
            <Button variant="outline" size="sm">
              <ArrowLeft class="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section class="mb-8 max-w-3xl">
        <div class="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck class="h-3.5 w-3.5 text-primary" />
          Transparência, segurança e uso responsável
        </div>
        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">Termos de Uso e Política de Privacidade</h1>
        <p class="mt-3 text-base leading-7 text-muted-foreground">
          Estes documentos explicam as regras de uso do Gestão Fácil ERP e como dados pessoais são tratados na
          plataforma. Leia com atenção antes de criar uma conta, contratar módulos ou inserir dados de terceiros.
        </p>
        <p class="mt-3 text-sm font-medium">Última atualização: {{ updatedAt }}</p>
      </section>

      <Alert class="mb-8 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Aviso fiscal e profissional</AlertTitle>
        <AlertDescription class="leading-6">
          O Gestão Fácil é uma ferramenta de apoio à gestão. Relatórios, projeções, conteúdos de IA e cupons não
          fiscais não substituem documentos fiscais, contabilidade, assessoria jurídica ou decisão profissional.
          O assinante deve validar suas obrigações com profissionais habilitados.
        </AlertDescription>
      </Alert>

      <Tabs :model-value="activeTab" class="w-full" @update:model-value="changeTab">
        <TabsList class="mb-8 grid h-auto w-full grid-cols-2 p-1 print:hidden">
          <TabsTrigger value="termos" class="gap-2 py-2.5 flex items-center">
            <FileText class="h-4 w-4 inline-flex" />
            Termos de Uso
          </TabsTrigger>
          <TabsTrigger value="privacidade" class="gap-2 py-2.5 flex items-center">
            <ShieldCheck class="h-4 w-4 inline-flex" />
            Privacidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="termos" class="mt-0">
          <div class="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <Card class="h-fit lg:sticky lg:top-24 print:hidden">
              <CardHeader class="pb-3">
                <CardTitle class="text-base">Nesta seção</CardTitle>
              </CardHeader>
              <CardContent>
                <nav aria-label="Índice dos Termos de Uso">
                  <ul class="space-y-2 text-sm">
                    <li v-for="item in termsIndex" :key="item[0]">
                      <a
                        :href="`#${item[0]}`"
                        class="text-muted-foreground transition-colors hover:text-primary"
                        @click.prevent="scrollToSection(item[0])"
                      >
                        {{ item[1] }}
                      </a>
                    </li>
                  </ul>
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termos de Uso do Gestão Fácil ERP</CardTitle>
                <CardDescription>Contrato aplicável ao acesso à plataforma e aos módulos contratados.</CardDescription>
              </CardHeader>
              <CardContent class="legal-content">
                <section id="termos-objeto">
                  <h2>1. Objeto, partes e aceitação</h2>
                  <p>
                    Estes Termos regulam o uso do Gestão Fácil ERP (“Gestão Fácil” ou “Plataforma”), serviço SaaS
                    disponibilizado pelo fornecedor identificado na contratação, cobrança e canais oficiais, pelo
                    titular da conta contratante (“Assinante”) e pelos usuários autorizados por ele.
                  </p>
                  <p>
                    Ao criar conta, marcar o aceite, contratar um plano ou usar a Plataforma, o usuário declara ter
                    lido e aceitado estes Termos e a Política de Privacidade. Quem aceita em nome de empresa declara
                    possuir poderes para vinculá-la. O serviço é destinado a pessoas civilmente capazes e a atividades
                    lícitas. Direitos obrigatórios previstos em lei permanecem preservados.
                  </p>
                </section>

                <Separator />

                <section id="termos-conta">
                  <h2>2. Cadastro, usuários e segurança da conta</h2>
                  <ul>
                    <li>O Assinante deve fornecer dados verdadeiros, completos e atualizados e manter um usuário responsável pela conta.</li>
                    <li>Credenciais são pessoais. O Assinante responde pela criação de usuários, permissões, desligamentos e atividades realizadas sob sua administração.</li>
                    <li>Senhas devem ser protegidas e não podem ser compartilhadas. Suspeitas de acesso indevido devem ser comunicadas imediatamente pelos canais oficiais.</li>
                    <li>O Assinante deve revisar permissões e garantir que seus dispositivos, redes, integrações e cópias exportadas sejam mantidos em segurança.</li>
                    <li>A Plataforma pode aplicar limites de tentativa, expiração de sessão, revogação de tokens e outras medidas razoáveis de proteção.</li>
                  </ul>
                </section>

                <Separator />

                <section id="termos-servicos">
                  <h2>3. Serviços, módulos e limitações funcionais</h2>
                  <p>
                    Conforme o plano e os apps ativados, a Plataforma pode oferecer cadastros, estoque, vendas e PDV,
                    financeiro, clientes e fornecedores, ordens de serviço, contratos recorrentes, arena e comandas,
                    relatórios, catálogo e loja virtual, arquivos, notificações, atendimento, WhatsApp, inteligência
                    artificial e integrações de pagamento. Funcionalidades, limites e preços exibidos na contratação
                    integram estes Termos.
                  </p>
                  <p>
                    A Plataforma auxilia registros operacionais, mas não garante resultado comercial, financeiro,
                    tributário ou jurídico. O Assinante é responsável pela qualidade das informações inseridas, pela
                    conferência de cálculos e relatórios e pela manutenção dos documentos legalmente exigidos.
                  </p>
                  <p>
                    Cupons e impressões identificados como não fiscais servem somente ao controle operacional. O
                    Assinante deve emitir NF-e, NFC-e, NFS-e ou outros documentos fiscais quando exigidos e configurar
                    corretamente tributos, certificados e integrações eventualmente disponíveis.
                  </p>
                </section>

                <Separator />

                <section id="termos-dados">
                  <h2>4. Dados do Assinante e proteção de dados</h2>
                  <p>
                    O Assinante mantém a titularidade de seus dados e concede ao Gestão Fácil autorização limitada para
                    hospedá-los, copiá-los, transmiti-los e tratá-los na medida necessária à prestação, segurança,
                    suporte, cobrança e cumprimento de obrigações legais.
                  </p>
                  <p>
                    Para dados pessoais de clientes, empregados, fornecedores e demais terceiros inseridos pelo
                    Assinante, o Assinante normalmente atua como controlador e o Gestão Fácil como operador, seguindo
                    instruções compatíveis com o serviço. Cabe ao Assinante definir base legal e finalidade, prestar
                    informações aos titulares, atender seus direitos e evitar coleta excessiva ou ilícita.
                  </p>
                  <p>
                    O Assinante não deve inserir dados pessoais sensíveis, dados de crianças e adolescentes, segredos
                    de terceiros ou conteúdo sujeito a sigilo especial sem necessidade, base legal, controles e
                    autorizações adequados. A Política de Privacidade complementa esta cláusula.
                  </p>
                </section>

                <Separator />

                <section id="termos-pagamentos">
                  <h2>5. Teste, planos, apps, pagamentos e reajustes</h2>
                  <ul>
                    <li>Períodos de teste, preço, vencimento, módulos e forma de cobrança são os informados na oferta ou contratação vigente.</li>
                    <li>Apps opcionais podem ser cobrados separadamente e de forma proporcional ao período de ativação, conforme informado antes da contratação.</li>
                    <li>Tributos incidentes e encargos por atraso poderão ser aplicados quando previstos na cobrança e permitidos por lei.</li>
                    <li>Preços podem ser reajustados mediante comunicação prévia razoável, preservados contratos, ofertas e direitos legais aplicáveis.</li>
                    <li>A inadimplência pode resultar em restrição ou suspensão de acesso após os avisos e prazos operacionais aplicáveis.</li>
                    <li>Pedidos de arrependimento, estorno ou reembolso serão analisados conforme a natureza da contratação, o uso do serviço e a legislação obrigatoriamente aplicável.</li>
                  </ul>
                  <p>
                    Gateways e instituições de pagamento processam transações sob seus próprios termos. O Gestão Fácil
                    não é instituição financeira, não custodia valores das vendas do Assinante e não garante aprovação,
                    liquidação, contestação, estorno ou disponibilidade de meios de pagamento de terceiros.
                  </p>
                </section>

                <Separator />

                <section id="termos-integracoes">
                  <h2>6. Integrações, loja virtual, WhatsApp e inteligência artificial</h2>
                  <p>
                    Integrações dependem de fornecedores externos, credenciais válidas, disponibilidade técnica e
                    aceitação dos termos desses fornecedores. O Assinante autoriza a transmissão dos dados necessários
                    ao recurso que ativar e responde pela configuração, permissões, custos externos e revogação de
                    chaves. Alterações ou indisponibilidade de terceiros podem limitar funcionalidades sem que isso
                    constitua falha exclusiva da Plataforma.
                  </p>
                  <p>
                    Na loja virtual, o Assinante é o fornecedor dos produtos e serviços anunciados e responde por
                    ofertas, estoque, preço, frete, entrega, troca, arrependimento, garantia, atendimento ao consumidor,
                    tributos e informações obrigatórias. O Gestão Fácil fornece a infraestrutura tecnológica e não é
                    parte da compra entre o Assinante e seu cliente.
                  </p>
                  <p>
                    Recursos de WhatsApp e atendimento só podem ser usados com contatos legítimos, base legal e respeito
                    às regras da Meta, do provedor integrado e de combate a spam. O Assinante responde pelo conteúdo,
                    frequência, opt-out e destinatários das mensagens.
                  </p>
                  <p>
                    Resultados de IA podem conter erros, omissões ou conteúdo inadequado. Eles são auxiliares e devem ser
                    revisados por pessoa competente antes de qualquer uso. Não devem ser usados como única base para
                    decisões fiscais, financeiras, jurídicas, trabalhistas, médicas ou que produzam efeitos relevantes
                    sobre pessoas. O Assinante não deve enviar à IA informações sigilosas ou pessoais além do necessário.
                  </p>
                </section>

                <Separator />

                <section id="termos-uso">
                  <h2>7. Uso permitido, conteúdo e propriedade intelectual</h2>
                  <p>É proibido usar a Plataforma para:</p>
                  <ul>
                    <li>fraude, lavagem de dinheiro, violação de direitos, discriminação, assédio ou qualquer atividade ilícita;</li>
                    <li>spam, malware, phishing, exploração de vulnerabilidades ou tentativa de contornar autenticação, limites e controles;</li>
                    <li>copiar, revender, sublicenciar, realizar engenharia reversa ou explorar o software fora das permissões legais ou contratuais;</li>
                    <li>armazenar ou divulgar conteúdo ilegal, ofensivo, enganoso ou que viole propriedade intelectual, privacidade ou sigilo;</li>
                    <li>sobrecarregar a infraestrutura, automatizar acessos não autorizados ou interferir no uso de terceiros.</li>
                  </ul>
                  <p>
                    O software, marca, interfaces, documentação e componentes da Plataforma pertencem a seus respectivos
                    titulares. A contratação concede licença limitada, revogável, não exclusiva e intransferível durante
                    a vigência. O Assinante preserva direitos sobre seu conteúdo e declara possuir autorização para
                    utilizá-lo. Sugestões voluntárias podem ser usadas para evolução do produto sem revelar dados
                    confidenciais.
                  </p>
                </section>

                <Separator />

                <section id="termos-cancelamento">
                  <h2>8. Disponibilidade, suspensão, cancelamento e dados após o término</h2>
                  <p>
                    O Gestão Fácil busca disponibilidade e continuidade compatíveis com um serviço online, mas não
                    promete operação ininterrupta. Manutenções, incidentes, internet, fornecedores externos, caso
                    fortuito ou força maior podem causar indisponibilidade. Backups são medida de continuidade e não
                    substituem exportações e controles próprios do Assinante.
                  </p>
                  <p>
                    O Assinante pode solicitar cancelamento pelos canais disponíveis. A conta pode ser suspensa ou
                    encerrada por inadimplência, risco de segurança, ordem legal, fraude ou violação relevante destes
                    Termos, com aviso quando cabível. Antes do encerramento, o Assinante deve exportar os dados que
                    desejar conservar. Após o término, dados podem ser bloqueados, eliminados ou mantidos pelo prazo
                    necessário a obrigações legais, prevenção a fraude, exercício de direitos e rotinas técnicas, sem
                    garantia de recuperação posterior.
                  </p>
                </section>

                <Separator />

                <section id="termos-responsabilidade">
                  <h2>9. Responsabilidades, garantias e limites</h2>
                  <p>
                    Cada parte responde por seus atos, obrigações legais e danos diretos comprovadamente causados, nos
                    limites da legislação aplicável. O Gestão Fácil não responde por dados incorretos inseridos pelo
                    Assinante, decisões tomadas sem validação, atos de usuários autorizados, conteúdo ou produtos do
                    Assinante, falhas de terceiros, uso contrário às instruções ou eventos fora de seu controle razoável.
                  </p>
                  <p>
                    Nenhuma cláusula exclui responsabilidade que não possa ser legalmente limitada, direitos do
                    consumidor quando efetivamente aplicáveis, deveres de proteção de dados ou reparação por dolo ou
                    culpa nos termos da lei. O Assinante deve cooperar para mitigar danos e responder por reclamações de
                    terceiros decorrentes de seu conteúdo, operação comercial ou uso ilícito da Plataforma.
                  </p>
                </section>

                <Separator />

                <section id="termos-gerais">
                  <h2>10. Alterações, comunicações, lei aplicável e contato</h2>
                  <p>
                    Estes Termos podem ser atualizados para refletir mudanças legais, técnicas ou comerciais. Alterações
                    relevantes serão comunicadas por meio razoável e indicarão nova data de vigência. Se a mudança
                    exigir novo consentimento, ele será solicitado. A invalidade de uma cláusula não afeta as demais e a
                    tolerância não implica renúncia de direito.
                  </p>
                  <p>
                    Aplicam-se as leis brasileiras. Eventuais conflitos serão submetidos ao foro legalmente competente,
                    respeitado o foro do consumidor quando a legislação de consumo for aplicável. Dúvidas contratuais
                    podem ser enviadas para
                    <a href="mailto:admin@userp.com.br">admin@userp.com.br</a>.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacidade" class="mt-0">
          <div class="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <Card class="h-fit lg:sticky lg:top-24 print:hidden">
              <CardHeader class="pb-3">
                <CardTitle class="text-base">Nesta seção</CardTitle>
              </CardHeader>
              <CardContent>
                <nav aria-label="Índice da Política de Privacidade">
                  <ul class="space-y-2 text-sm">
                    <li v-for="item in privacyIndex" :key="item[0]">
                      <a
                        :href="`#${item[0]}`"
                        class="text-muted-foreground transition-colors hover:text-primary"
                        @click.prevent="scrollToSection(item[0])"
                      >
                        {{ item[1] }}
                      </a>
                    </li>
                  </ul>
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Política de Privacidade</CardTitle>
                <CardDescription>Como o Gestão Fácil trata dados pessoais em seus sites, apps e serviços.</CardDescription>
              </CardHeader>
              <CardContent class="legal-content">
                <section>
                  <h2>1. Escopo e compromisso</h2>
                  <p>
                    Esta Política se aplica ao site, ao ERP, aos módulos opcionais, à loja virtual e aos canais de
                    suporte do Gestão Fácil. Ela descreve categorias de dados, finalidades, bases legais,
                    compartilhamentos, retenção, segurança e direitos previstos na Lei nº 13.709/2018 (LGPD).
                  </p>
                  <p>
                    O tratamento concreto depende dos recursos utilizados. Esta Política não substitui o aviso de
                    privacidade que cada Assinante deve fornecer às pessoas cujos dados insere ou coleta por meio da
                    Plataforma.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-papeis">
                  <h2>2. Quem controla os dados</h2>
                  <p>
                    O fornecedor do Gestão Fácil atua como <strong>controlador</strong> dos dados necessários para
                    cadastro, contratação, faturamento, segurança, suporte, comunicação institucional e administração
                    da própria Plataforma.
                  </p>
                  <p>
                    Para dados que o Assinante cadastra sobre clientes, empregados, fornecedores, consumidores ou
                    outros terceiros, o Assinante normalmente é o <strong>controlador</strong> e o Gestão Fácil atua
                    como <strong>operador</strong>, tratando-os para prestar o serviço e conforme as configurações do
                    Assinante. Em algumas integrações, fornecedores externos podem atuar como operadores ou
                    controladores independentes, segundo suas próprias políticas e decisões legais.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-dados">
                  <h2>3. Categorias de dados tratados</h2>
                  <ul>
                    <li><strong>Cadastro e conta:</strong> nome, e-mail, telefone, senha protegida por hash, documento, endereço, empresa, segmento, equipe, permissões e preferências.</li>
                    <li><strong>Contratação e cobrança:</strong> plano, apps, faturas, vencimentos, identificadores e status de pagamentos. Dados completos de cartão são processados pelos gateways, quando aplicável.</li>
                    <li><strong>Operação empresarial:</strong> clientes, fornecedores, produtos, estoque, vendas, finanças, ordens de serviço, contratos, assinaturas, reservas, comandas, documentos e relatórios.</li>
                    <li><strong>Loja e consumidor final:</strong> conta do cliente, contato, endereço, carrinho, pedidos, entrega, cobrança e histórico de atendimento.</li>
                    <li><strong>Comunicações e conteúdo:</strong> mensagens, contatos e mídias de WhatsApp, arquivos enviados, solicitações de suporte, notificações e entradas e respostas de IA quando os recursos forem utilizados.</li>
                    <li><strong>Integrações:</strong> chaves, tokens, identificadores de instância, webhooks e configurações necessárias para conectar serviços escolhidos pelo Assinante.</li>
                    <li><strong>Dados técnicos e segurança:</strong> IP, data e hora, navegador, dispositivo, agente de usuário, sessão, eventos de autenticação, falhas, logs e trilhas de auditoria, inclusive acessos de suporte autorizados.</li>
                    <li><strong>Preferências locais:</strong> tokens de sessão, carrinhos, impressora, tema e outras escolhas armazenadas no navegador.</li>
                  </ul>
                  <p>
                    O Gestão Fácil não solicita, como regra, dados pessoais sensíveis. Se o Assinante decidir inseri-los,
                    deverá comprovar necessidade, base legal e medidas reforçadas. A Plataforma não é direcionada a
                    crianças; dados de menores somente devem ser tratados pelo Assinante quando sua atividade e a lei o
                    permitirem, com as salvaguardas adequadas.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-finalidades">
                  <h2>4. Finalidades e bases legais</h2>
                  <div class="overflow-x-auto">
                    <table>
                      <thead>
                        <tr><th>Finalidade</th><th>Bases legais usuais</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>Criar conta, autenticar, disponibilizar módulos, suporte e cobrança</td><td>Execução de contrato e procedimentos preliminares</td></tr>
                        <tr><td>Segurança, prevenção a fraude, auditoria e melhoria do serviço</td><td>Legítimo interesse, execução de contrato e proteção de direitos</td></tr>
                        <tr><td>Emitir cobranças, manter registros e atender autoridades</td><td>Cumprimento de obrigação legal ou regulatória e exercício regular de direitos</td></tr>
                        <tr><td>Enviar avisos operacionais, recuperação de senha e notificações contratadas</td><td>Execução de contrato e legítimo interesse</td></tr>
                        <tr><td>Enviar dicas e novidades opcionais</td><td>Consentimento, que pode ser revogado</td></tr>
                        <tr><td>Tratar dados inseridos pelo Assinante para operar ERP, loja, WhatsApp, pagamentos e IA</td><td>Instruções do controlador e bases legais definidas por ele</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Quando o tratamento se basear em legítimo interesse, serão considerados finalidade, necessidade,
                    expectativas razoáveis e direitos do titular. Quando depender de consentimento, a recusa ou
                    revogação pode impedir apenas o recurso correspondente, sem afetar tratamentos apoiados em outra
                    base legal.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-compartilhamento">
                  <h2>5. Compartilhamento, fornecedores e transferências</h2>
                  <p>Dados podem ser compartilhados, no limite necessário, com:</p>
                  <ul>
                    <li>provedores de hospedagem, banco de dados, cache, filas, armazenamento de arquivos, monitoramento, e-mail e notificações;</li>
                    <li>gateways e parceiros de pagamento, como Asaas, Mercado Pago e AbacatePay, conforme a integração utilizada;</li>
                    <li>provedores de WhatsApp, atendimento e APIs relacionadas, quando o Assinante ativar esses módulos;</li>
                    <li>provedores de inteligência artificial, como Google Gemini, somente quando o recurso for acionado e conforme os dados enviados;</li>
                    <li>consultores profissionais, autoridades públicas, órgãos reguladores ou partes de processo, quando necessário por lei, ordem válida ou exercício de direitos;</li>
                    <li>eventual sucessor empresarial, mediante salvaguardas e continuidade das obrigações aplicáveis.</li>
                  </ul>
                  <p>
                    Alguns fornecedores podem processar dados fora do Brasil. Nesses casos, são adotados mecanismos
                    contratuais e medidas compatíveis com a LGPD, considerando a natureza do serviço e as garantias do
                    destinatário. O Gestão Fácil não vende nem aluga dados pessoais para publicidade de terceiros.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-cookies">
                  <h2>6. Cookies, sessões e armazenamento no dispositivo</h2>
                  <p>
                    A Plataforma usa cookies e armazenamento local necessários para autenticação, renovação de sessão,
                    segurança, carrinho, preferências, impressão e continuidade de fluxos. A loja virtual pode utilizar
                    cookie HTTP-only para sessão do cliente. Bloquear esses recursos no navegador pode impedir login,
                    checkout ou outras funções essenciais.
                  </p>
                  <p>
                    Se ferramentas opcionais de análise ou publicidade que não sejam estritamente necessárias forem
                    adicionadas, o aviso e os controles de consentimento deverão ser atualizados antes de sua ativação,
                    quando exigido.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-retencao">
                  <h2>7. Retenção, cópias e eliminação</h2>
                  <p>
                    Os dados são mantidos enquanto a conta estiver ativa e pelo tempo necessário às finalidades
                    descritas, ao cumprimento de obrigações legais, prevenção a fraude, cobrança, auditoria e exercício
                    de direitos. Registros de acesso a aplicações podem ser conservados nos prazos exigidos pelo Marco
                    Civil da Internet e por ordens válidas. Prazos também variam conforme natureza financeira, fiscal,
                    contratual e de suporte do registro.
                  </p>
                  <p>
                    Após cancelamento ou pedido válido, dados podem ser eliminados, anonimizados ou bloqueados, salvo
                    quando a manutenção for autorizada ou exigida por lei. Exclusões podem levar tempo para alcançar
                    backups protegidos, que permanecem isolados até sua sobrescrita conforme o ciclo técnico e não são
                    usados para finalidades comuns. O Assinante deve exportar dados necessários antes do encerramento.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-seguranca">
                  <h2>8. Segurança, suporte e incidentes</h2>
                  <p>
                    São adotadas medidas técnicas e administrativas proporcionais ao risco, incluindo controle de
                    acesso por conta e permissão, hash de senhas, transporte seguro, limitação de tentativas, validação
                    de sessões, segregação lógica, backups, registros e auditoria de acessos de suporte. Nenhum ambiente
                    é totalmente imune; por isso, o Assinante também deve proteger credenciais, dispositivos,
                    integrações e dados exportados.
                  </p>
                  <p>
                    A equipe de suporte poderá acessar uma conta quando necessário ao atendimento, segurança ou
                    operação autorizada. Acessos administrativos de suporte são limitados, temporários e registrados
                    para auditoria conforme os controles disponíveis.
                  </p>
                  <p>
                    Incidentes com risco ou dano relevante serão avaliados e comunicados à ANPD e aos titulares pelo
                    controlador responsável, nos termos da lei e regulamentação. Quando atuar como operador, o Gestão
                    Fácil informará o Assinante controlador sem demora injustificada e cooperará com as informações
                    disponíveis.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-direitos">
                  <h2>9. Direitos dos titulares e como exercê-los</h2>
                  <p>
                    Conforme a LGPD e observadas as exceções legais, o titular pode solicitar confirmação e acesso,
                    correção, informação sobre compartilhamentos, anonimização, bloqueio ou eliminação de dados
                    desnecessários ou irregulares, portabilidade quando regulamentada, revisão de decisões unicamente
                    automatizadas, oposição, informação sobre consentimento e sua revogação.
                  </p>
                  <p>
                    O pedido poderá exigir validação de identidade e detalhes suficientes para localizar os dados. Se
                    os dados foram coletados por uma empresa que usa o Gestão Fácil — por exemplo, uma loja, prestador
                    ou empregador — o titular deve procurar primeiro essa empresa, que é a controladora. O Gestão Fácil
                    dará suporte ao Assinante para responder quando atuar como operador.
                  </p>
                  <p>
                    Direitos não são absolutos: alguns dados podem ser preservados para obrigação legal, prevenção a
                    fraude, segurança ou exercício de direitos. O titular pode ainda peticionar à Autoridade Nacional
                    de Proteção de Dados após tentar exercer seu direito perante o controlador.
                  </p>
                </section>

                <Separator />

                <section id="privacidade-contato">
                  <h2>10. Atualizações e contato de privacidade</h2>
                  <p>
                    Esta Política pode ser atualizada por mudanças legais, técnicas ou operacionais. Mudanças relevantes
                    serão destacadas por meio razoável e a data acima será atualizada. Solicitações sobre dados pessoais
                    e contato com o responsável pelo canal de privacidade podem ser enviados para
                    <a href="mailto:admin@userp.com.br">admin@userp.com.br</a>. O mesmo endereço recebe dúvidas gerais
                    sobre a contratação e a Plataforma.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div class="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border bg-card p-5 sm:flex-row print:hidden">
        <div class="flex items-start gap-3">
          <Mail class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p class="font-semibold">Ainda tem dúvidas?</p>
            <p class="text-sm text-muted-foreground">Fale com nossos canais oficiais antes de contratar ou inserir dados pessoais.</p>
          </div>
        </div>
        <Button variant="outline" as-child>
          <a href="mailto:admin@userp.com.br">Entrar em contato</a>
        </Button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.legal-content {
  @apply space-y-7 text-sm leading-7 text-muted-foreground md:text-base;
}

.legal-content section {
  scroll-margin-top: 6rem;
}

.legal-content h2 {
  @apply mb-3 text-xl font-bold tracking-tight text-foreground;
}

.legal-content p + p {
  @apply mt-3;
}

.legal-content ul {
  @apply mt-3 list-disc space-y-2 pl-6;
}

.legal-content strong {
  @apply font-semibold text-foreground;
}

.legal-content a {
  @apply font-medium text-primary underline underline-offset-4;
}

.legal-content table {
  @apply mt-3 min-w-[640px] w-full border-collapse text-left text-sm;
}

.legal-content th {
  @apply border bg-muted/60 px-3 py-2 font-semibold text-foreground;
}

.legal-content td {
  @apply border px-3 py-2 align-top;
}

@media print {
  .legal-content {
    color: #27272a;
    font-size: 11pt;
    line-height: 1.55;
  }

  .legal-content h2 {
    color: #09090b;
    break-after: avoid;
  }

  .legal-content section {
    break-inside: avoid-page;
  }
}
</style>

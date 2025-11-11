declare module 'qz-tray' {
  export interface PrintData {
    type: string
    format?: string
    flavor?: string
    data: string
  }

  export interface ConfigOptions {
    copies?: number
    size?: { width: number; height: number }
    units?: string
    jobName?: string
  }

  export interface Config {
    printer: string
    options: ConfigOptions
  }

  export interface Websocket {
    connect(): Promise<void>
    disconnect(): Promise<void>
    isActive(): boolean
  }

  export interface Printers {
    find(): Promise<string[]>
  }

  export interface Security {
    setCertificatePromise(cb: () => Promise<string>): Promise<void>
    setSignatureAlgorithm(alg: string): Promise<void>
    setSignaturePromise(cb: (toSign: string) => Promise<string>): Promise<void>
  }

  export interface Configs {
    create(printer: string, options?: ConfigOptions): Config
  }

  export interface QZ {
    websocket: Websocket
    printers: Printers
    security: Security
    configs: Configs
    print(config: Config, data: PrintData[]): Promise<void>
  }

  const qz: QZ
  export default qz
}

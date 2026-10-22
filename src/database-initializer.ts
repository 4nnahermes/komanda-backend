export interface Inicializavel {
    readonly isInitialized: boolean;
    initialize(): Promise<unknown>;
}

// Compartilha uma única inicialização concorrente por instância de execução.
// Falhas liberam a promessa para permitir uma nova tentativa na próxima chamada.
export class InicializadorDeBanco<T extends Inicializavel> {
    private inicializacao?: Promise<T>;

    constructor(private readonly dataSource: T) {}

    inicializar(): Promise<T> {
        if (this.dataSource.isInitialized) return Promise.resolve(this.dataSource);
        if (!this.inicializacao) {
            this.inicializacao = this.dataSource.initialize()
                .then(() => this.dataSource)
                .catch((erro: unknown) => {
                    this.inicializacao = undefined;
                    throw erro;
                });
        }
        return this.inicializacao;
    }
}

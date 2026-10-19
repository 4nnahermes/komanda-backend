// Erros de regra de negócio. O domínio e os casos de uso lançam estes erros
// sem saber nada de HTTP: quem decide o código da resposta é a camada HTTP
// (src/interfaces/http/tratar-erros.ts).
export abstract class ErroDeDominio extends Error {
    constructor(mensagem: string) {
        super(mensagem);
        this.name = new.target.name;
    }
}

// Dado inválido ou faltando. Na API vira 400.
export class ErroDeValidacao extends ErroDeDominio {}

// O registro procurado não existe. Na API vira 404.
export class RecursoNaoEncontrado extends ErroDeDominio {}

// Conflito com um dado que já existe, como nome repetido. Na API vira 409.
export class ConflitoDeDados extends ErroDeDominio {}

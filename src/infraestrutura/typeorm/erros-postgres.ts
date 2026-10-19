import { QueryFailedError } from "typeorm";

// Códigos de erro do PostgreSQL usados para traduzir falhas do banco em erros do domínio.
const VIOLACAO_DE_UNICIDADE = "23505";
const VIOLACAO_DE_CHAVE_ESTRANGEIRA = "23503";

export function ehViolacaoDeUnicidade(erro: unknown): boolean {
    return codigoDoErro(erro) === VIOLACAO_DE_UNICIDADE;
}

export function ehViolacaoDeChaveEstrangeira(erro: unknown): boolean {
    return codigoDoErro(erro) === VIOLACAO_DE_CHAVE_ESTRANGEIRA;
}

function codigoDoErro(erro: unknown): string | undefined {
    if (!(erro instanceof QueryFailedError)) return undefined;
    return (erro.driverError as { code?: string }).code;
}

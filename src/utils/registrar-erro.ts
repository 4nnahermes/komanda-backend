// Erros do cliente de banco podem conter detalhes de conexão. Nunca imprimir
// mensagem/stack ou o objeto inteiro em logs públicos do ambiente de execução.
export function registrarErro(erro: unknown): void {
    const dados = erro as { name?: unknown; code?: unknown } | null;
    const codigo = typeof dados?.code === "string" && /^P\d{4}$/.test(dados.code) ? dados.code : "sem código";
    console.error(`Falha interna no servidor (${codigo})`);
}

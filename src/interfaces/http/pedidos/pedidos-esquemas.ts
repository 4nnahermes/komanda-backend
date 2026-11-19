import { z } from "zod";
import { FORMAS_PAGAMENTO, STATUS_PEDIDO, TIPOS_PEDIDO } from "../../../dominio/pedidos/pedido";

const objeto = { error: "O corpo da requisição deve ser um objeto JSON" };
const mensagemQuantidade = "A quantidade deve ser um número inteiro de 1 a 99";
const mensagemProduto = "Produto não encontrado ou indisponível";
const mensagemItens = "Informe ao menos um item";
const mensagemRetirados = "Os ingredientes retirados devem ser uma lista de textos";
const mensagemAdicionais = "Os adicionais devem ser uma lista de textos";
const mensagemStatus = "O status deve ser EM_PREPARO, PRONTO, ENTREGUE ou CANCELADO";

// Só confere tipos e formatos. As regras do pedido (bairro só na entrega,
// valor recebido só em dinheiro, etc.) ficam no domínio.
const item = z.object({
    produtoId: z.number({ error: "Informe o produto do item" }).int(mensagemProduto).positive(mensagemProduto).max(2_147_483_647, mensagemProduto),
    quantidade: z.number({ error: mensagemQuantidade }).int(mensagemQuantidade).min(1, mensagemQuantidade).max(99, mensagemQuantidade),
    ingredientesRetirados: z.array(z.string({ error: mensagemRetirados }), { error: mensagemRetirados }).optional(),
    adicionais: z.array(z.string({ error: mensagemAdicionais }), { error: mensagemAdicionais }).optional(),
}, { error: mensagemItens });

export const esquemaNovoPedido = z.object({
    tipo: z.enum(TIPOS_PEDIDO, { error: "O tipo do pedido deve ser ENTREGA ou RETIRADA" }),
    nomeCliente: z.string({ error: "O nome do cliente é obrigatório" }),
    telefone: z.string({ error: "O telefone deve ser um texto" }).nullable().optional(),
    bairroId: z.number({ error: "Bairro não encontrado ou inativo" }).int("Bairro não encontrado ou inativo").nullable().optional(),
    endereco: z.string({ error: "Informe o endereço da entrega" }).nullable().optional(),
    itens: z.array(item, { error: mensagemItens }).min(1, mensagemItens).max(50, "O pedido pode ter no máximo 50 itens"),
    formaPagamento: z.enum(FORMAS_PAGAMENTO, { error: "A forma de pagamento deve ser PIX, CREDITO, DEBITO, DINHEIRO ou FIADO" }),
    valorRecebido: z.number({ error: "O valor recebido deve ser um número com até 2 casas decimais" }).nullable().optional(),
}, objeto);

export const esquemaStatusPedido = z.object({
    status: z.enum(STATUS_PEDIDO, { error: mensagemStatus }),
}, objeto);

export const esquemaMotoboyPedido = z.object({
    motoboyId: z.number({ error: "Informe o motoboy ou null para remover" })
        .int("Motoboy não encontrado ou inativo")
        .positive("Motoboy não encontrado ou inativo")
        .max(2_147_483_647, "Motoboy não encontrado ou inativo")
        .nullable(),
}, objeto);

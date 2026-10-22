# Modelo de dados — MongoDB

O schema executável é `prisma/schema.prisma`. Esta cópia substitui PostgreSQL/TypeORM por MongoDB/Prisma sem alterar as respostas da API.

| Coleção | Conteúdo | Índices relevantes |
|---|---|---|
| categorias | `_id` inteiro, nome, nomeNormalizado, ordem, ativo | nomeNormalizado único; ordem/id |
| produtos | `_id` inteiro, nome, nomeNormalizado, descricao opcional, precoCentavos Long, categoriaId inteiro, ativo, ingredientes e adicionais embutidos | categoriaId/nomeNormalizado único; ativo/categoriaId |
| bairros | `_id` inteiro, nome, nomeNormalizado, taxaEntregaCentavos Long, ativo | nomeNormalizado único; nome/id |
| motoboys | `_id` inteiro, nome, nomeNormalizado, telefone opcional, valorFixoNoiteCentavos Long, ativo | nomeNormalizado único; nome/id |
| contadores | `_id` textual, valor inteiro | chave primária |

Os IDs públicos continuam inteiros positivos de 32 bits. O contador por coleção é incrementado na mesma transação da criação; rollback não consome o valor da transação abortada. Uma chave adicional `lock:catalogo` serializa escritas relacionadas no catálogo. Nomes normalizados são aparados e convertidos para minúsculas em pt-BR; acentos não são removidos.

Dinheiro é armazenado em centavos inteiros de 64 bits (Prisma BigInt/BSON long), inclusive nos adicionais. A conversão para número em reais ocorre na saída e preserva o intervalo existente de até R$ 99.999.999,99. O JSON público nunca contém BigInt nem campos internos como nomeNormalizado.

MongoDB não impõe foreign keys. O serviço de categorias e o repositório de produtos usam o mesmo bloqueio transacional: não é possível excluir categoria com produtos, nem criar/mover produto para categoria excluída pelo caminho da API. Alterações diretas feitas fora da API não possuem essa proteção. Transações exigem replica set. Não há coleções de pedidos, estoque ou caixa nesta entrega.

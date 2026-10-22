# Validação da compatibilidade Mau Mau

Validação integrada executada pelo responsável da integração em 22/10/2026, usando o PostgreSQL descartável `komanda_test_mau` e a API local na porta 3017.

## Evidências

- A migration compilada executou `up`, `down` e `up` novamente. Os registros legados mantiveram nome e preço; os campos novos começaram como listas vazias.
- CRUDs de categorias, produtos, bairros e motoboys continuaram funcionais.
- Produto aceitou e devolveu ingredientes e adicionais no contrato da fonte Mau Mau.
- `PATCH` preservou campos omitidos e gravou corretamente valores `0`, `false`, `null` e listas vazias; nomes e descrições foram persistidos já normalizados.
- Adicional com preço de três casas decimais foi rejeitado com HTTP 400.
- O cardápio retornou ingredientes e adicionais dos produtos.
- O módulo compilado exportou a aplicação Express como `default`, sem iniciar um listener. Cinco chamadas concorrentes de teste inicializaram um único `DataSource` contra o PostgreSQL descartável.

## Limites

Essa evidência cobre apenas a execução local com PostgreSQL descartável. Nenhuma conexão real com Supabase foi configurada e nenhum deploy ou teste real na Vercel foi feito. O procedimento de publicação está em [alinhamento-frontend.md](../contratos/alinhamento-frontend.md).

import { ValueTransformer } from "typeorm";

// O PostgreSQL devolve colunas numeric como texto ("32.90").
// Este transformer converte para número ao ler e mantém o valor ao gravar,
// para que a API sempre responda preços como número (32.9), como no contrato.
export const decimalTransformer: ValueTransformer = {
    to: (valor?: number | null) => valor,
    from: (valor?: string | null) => (valor === null || valor === undefined ? valor : Number(valor)),
};

// Valor em dinheiro guardado em centavos inteiros.
// Somar preços como número decimal acumula erro de arredondamento
// (0.1 + 0.2 = 0.30000000000000004); em centavos, a conta é sempre exata.
export class Dinheiro {
    private constructor(readonly centavos: number) {}

    static deCentavos(centavos: number): Dinheiro {
        if (!Number.isSafeInteger(centavos)) {
            throw new RangeError(`Centavos devem ser um número inteiro: ${centavos}`);
        }
        return new Dinheiro(centavos);
    }

    // Reais com no máximo 2 casas decimais: 32.9 é R$ 32,90; 32.905 é inválido.
    static ehValorEmReaisValido(valor: number): boolean {
        if (!Number.isFinite(valor)) return false;
        const centavos = valor * 100;
        return Math.abs(centavos - Math.round(centavos)) < 1e-6;
    }

    static deReais(valor: number): Dinheiro {
        if (!Dinheiro.ehValorEmReaisValido(valor)) {
            throw new RangeError(`Valor em reais com mais de 2 casas decimais: ${valor}`);
        }
        return new Dinheiro(Math.round(valor * 100));
    }

    get emReais(): number {
        return this.centavos / 100;
    }

    ehMaiorQueZero(): boolean {
        return this.centavos > 0;
    }

    somar(outro: Dinheiro): Dinheiro {
        return new Dinheiro(this.centavos + outro.centavos);
    }

    multiplicar(quantidade: number): Dinheiro {
        if (!Number.isInteger(quantidade)) {
            throw new RangeError(`A quantidade deve ser um número inteiro: ${quantidade}`);
        }
        return new Dinheiro(this.centavos * quantidade);
    }

    igual(outro: Dinheiro): boolean {
        return this.centavos === outro.centavos;
    }
}

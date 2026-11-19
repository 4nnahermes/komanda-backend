import { Dinheiro } from "../../dominio/compartilhado/dinheiro";
import { Pedido } from "../../dominio/pedidos/pedido";

export interface Referencia {
    id: number;
    nome: string;
}

export interface MotoboyDoAcerto {
    id: number;
    nome: string;
    valorFixoNoite: Dinheiro;
}

// Leituras de que o dashboard e o fechamento de caixa precisam.
// A implementação com Prisma fica em src/infraestrutura.
export interface ConsultaDashboard {
    // Só pedidos ENTREGUE, das noites de inicio a fim (AAAA-MM-DD, inclusive). RN6.
    listarPedidosEntregues(inicio: string, fim: string): Promise<Pedido[]>;

    // Categoria atual de cada produto. Produto excluído não aparece no mapa.
    categoriasDosProdutos(produtoIds: number[]): Promise<Map<number, Referencia>>;

    motoboys(ids: number[]): Promise<Map<number, MotoboyDoAcerto>>;
}

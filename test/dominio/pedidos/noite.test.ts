import { describe, expect, it } from "vitest";
import { ehNoiteValida, noiteDe } from "../../../src/dominio/pedidos/noite";

describe("noite de operação", () => {
    it("vira às 06:00 de Brasília", () => {
        // 22:15 de 17/11 em Brasília
        expect(noiteDe(new Date("2026-11-18T01:15:00Z"))).toBe("2026-11-17");
        // 05:59 de 18/11 ainda é a noite de 17/11
        expect(noiteDe(new Date("2026-11-18T08:59:00Z"))).toBe("2026-11-17");
        // 06:00 de 18/11 já é a noite de 18/11
        expect(noiteDe(new Date("2026-11-18T09:00:00Z"))).toBe("2026-11-18");
    });

    it("valida datas AAAA-MM-DD", () => {
        expect(ehNoiteValida("2026-11-17")).toBe(true);
        expect(ehNoiteValida("2026-02-30")).toBe(false);
        expect(ehNoiteValida("17/11/2026")).toBe(false);
    });
});

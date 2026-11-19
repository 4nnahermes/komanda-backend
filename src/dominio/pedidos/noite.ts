// Noite de operação da lancheria. O expediente passa da meia-noite, então
// o dia só "vira" às 06:00 no horário de Brasília: um pedido às 00:30 do dia
// 18 ainda pertence à noite do dia 17.
const FUSO = "America/Sao_Paulo";
const HORA_DA_VIRADA = 6;

const formatoData = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

// Devolve a noite no formato AAAA-MM-DD.
export function noiteDe(data: Date): string {
    const deslocada = new Date(data.getTime() - HORA_DA_VIRADA * 60 * 60 * 1000);
    return formatoData.format(deslocada);
}

// Confere se o texto é uma data AAAA-MM-DD que existe no calendário.
export function ehNoiteValida(valor: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

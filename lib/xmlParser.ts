// lib/xmlParser.ts
import { ParsedNfeItem } from '../types';

function mapUnit(xmlUnit: string): 'kg' | 'un' | 'm' | 'L' {
    const u = xmlUnit.toUpperCase();
    if (u.includes('KG')) return 'kg';
    if (u.includes('M')) return 'm';
    if (u.includes('L')) return 'L';
    return 'un';
}

export const parseNFeXML = (xmlString: string): Promise<ParsedNfeItem[]> => {
    return new Promise((resolve, reject) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");

            const parserError = xmlDoc.querySelector("parsererror");
            if (parserError) {
                reject(new Error("Arquivo XML malformatado."));
                return;
            }

            const productNodes = xmlDoc.querySelectorAll("det > prod");
            if (productNodes.length === 0) {
                reject(new Error("Nenhum produto (<prod>) encontrado na NFe. Verifique o formato do arquivo."));
                return;
            }

            const items: ParsedNfeItem[] = [];
            productNodes.forEach(prod => {
                const code = prod.querySelector("cProd")?.textContent;
                const name = prod.querySelector("xProd")?.textContent;
                const quantity = prod.querySelector("qCom")?.textContent;
                const unit = prod.querySelector("uCom")?.textContent;

                if (code && name && quantity && unit) {
                    items.push({
                        code: code,
                        name: name,
                        quantity: parseFloat(quantity),
                        unit: mapUnit(unit)
                    });
                }
            });

            resolve(items);
        } catch (error) {
            reject(new Error("Erro inesperado ao processar o arquivo XML."));
        }
    });
};

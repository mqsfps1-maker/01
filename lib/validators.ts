// lib/validators.ts

const allDigitsSame = (value: string) => {
    return value.split('').every(char => char === value[0]);
};

const calculateDigit = (value: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < value.length; i++) {
        sum += parseInt(value[i], 10) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
};

export const isValidCPF = (cpf: string): boolean => {
    if (cpf.length !== 11 || allDigitsSame(cpf)) {
        return false;
    }

    const firstDigitWeights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondDigitWeights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

    const firstDigit = calculateDigit(cpf.substring(0, 9), firstDigitWeights);
    if (firstDigit !== parseInt(cpf[9], 10)) {
        return false;
    }

    const secondDigit = calculateDigit(cpf.substring(0, 10), secondDigitWeights);
    if (secondDigit !== parseInt(cpf[10], 10)) {
        return false;
    }

    return true;
};

export const isValidCNPJ = (cnpj: string): boolean => {
    if (cnpj.length !== 14 || allDigitsSame(cnpj)) {
        return false;
    }

    const firstDigitWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondDigitWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const firstDigit = calculateDigit(cnpj.substring(0, 12), firstDigitWeights);
    if (firstDigit !== parseInt(cnpj[12], 10)) {
        return false;
    }

    const secondDigit = calculateDigit(cnpj.substring(0, 13), secondDigitWeights);
    if (secondDigit !== parseInt(cnpj[13], 10)) {
        return false;
    }

    return true;
};

export const isValidCpfCnpj = (value: string): boolean => {
    const cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length === 11) {
        return isValidCPF(cleanValue);
    }
    if (cleanValue.length === 14) {
        return isValidCNPJ(cleanValue);
    }
    return false;
};

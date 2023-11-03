/* --- Recuperando e validando os parâmetros da URL --- */

let params = new URLSearchParams(window.location.search);

let NP = params.get("np");
let TAX = params.get("tax");
let PV = params.get("pv");
let PP = params.get("pp");
let PB = params.get("pb");
let existeEntrada = params.get("dp") != null ? true : false;

let priceTableData = null;

if(NP != null && TAX != null && PV != null && PP != null) {
    priceTableData = calculatePriceTable(NP, PV, PP, TAX, existeEntrada);
} 
else {
    throw new UserException("DadosInvalidos");
}

/* --- Gerando a tabela dinamicamente --- */

const tableElement = document.getElementById("price-table");

priceTableData.forEach(rowData => {
    tableElement.appendChild(createTableRow(rowData));
});

/* --- Exibindo informações detalhadas --- */

document.getElementById("details-header").onclick = () => {
    if(document.getElementById("details-list").style.display == 'none') {
        document.getElementById("details-list").style.display = 'block';
        document.getElementById("details-header").innerHTML = "<span>&#8681;</span>Informações detalhadas"
    } else {
        document.getElementById("details-list").style.display = 'none';
        document.getElementById("details-header").innerHTML = "<span>&#8688;</span>Informações detalhadas"
    }
};

document.getElementById("li-parc").innerHTML += NP;
document.getElementById("li-taxa").innerHTML += TAX + "%";
document.getElementById("li-vf").innerHTML += PV;
document.getElementById("li-vv").innerHTML += PP;
document.getElementById("li-mv").innerHTML += PB;
document.getElementById("li-entrada").innerHTML += existeEntrada;

let cf = calculateFinancingCoefficient(TAX, NP);

document.getElementById("li-cf").innerHTML += cf.toFixed(4);
document.getElementById("li-prest").innerHTML += (PV * cf).toFixed(2);
document.getElementById("li-vp").innerHTML += "x";
document.getElementById("li-tr").innerHTML += calculateInterestRate(NP,PV,PP,existeEntrada) * 100;
document.getElementById("li-vc").innerHTML += "x";


/* --- Funções auxiliares --- */

function createTableRow(rowData) {
    const tableRow = document.createElement("tr");

    rowData.forEach(data => {
        const tableData = document.createElement("td");
        tableData.appendChild(document.createTextNode(data));
        tableRow.appendChild(tableData);
    });

    return tableRow
}

/**
 * Calcula a tabela price.
 * @func
 * @param {number} np - Número de parcelas.
 * @param {number} pv - Preço à vista.
 * @param {number} pp - Preço à prazo.
 * @param {number} t - Taxa de juros.
 * @param {boolean} e - Indica a existência de uma parcela de entrada.
 * @returns {Matrix} - Matriz cujas linhas são arrays da forma 
 *                     [mês , prestação , juros , amortização , saldo devedor]
 */
function calculatePriceTable(np, pv, pp, t, e) {

    let coefFinanc = calculateFinancingCoefficient(t,np);
    
    if(pp == 0.0) {
        pp = (pv / calculateAppliedFactor(np, t, coefFinanc, e)).toFixed(2);
    }

    let jurosReal = calculateInterestRate(np,pv,pp,e) * 100;
    let pmt = (pv * coefFinanc).toFixed(2);
    let jurosUsado = (t > 0) ? t : jurosReal.toFixed(4);
    let juros = jurosUsado;
    let jurosTotal = 0;
    let totalPago = 0;
    let amortizacaoTotal = 0;
    let amortizacao = 0;
    let saldoDevedor = pv;
    let matrizPrice = [];

    // Se existir entrada, dimunui o número de parcelas restantes
    if(e) np--;

    for(let i = 1; i <= np; i++){
        juros = (saldoDevedor * jurosUsado / 100).toFixed(2);
        amortizacao = (pmt - juros).toFixed(2);
        saldoDevedor -=  amortizacao;
        saldoDevedor = saldoDevedor > 0 ? saldoDevedor.toFixed(2) : 0;
     
        matrizPrice.push([i, pmt, juros, amortizacao, saldoDevedor]);

        jurosTotal += Number(juros);
        totalPago += Number(pmt);
        amortizacaoTotal += Number(amortizacao);
    }

    matrizPrice.push([`Total:`, `${totalPago.toFixed(2)}`,`${jurosTotal.toFixed(2)}`, `${amortizacaoTotal.toFixed(2)}`,`${saldoDevedor}`]);

    return matrizPrice;
}

function calculateAppliedFactor(np, t, coefFinanc, e){
    return fe(e, t) / (np * coefFinanc);
}

function fe(e, t){
    return e ? 1+t : 1;
}
/**
 * Calcula a taxa de juros real.
 * @param {int} np
 * @param {float} pv 
 * @param {float} pp 
 * @param {boolean} e 
 * @returns {float}
 */
function calculateInterestRate(np,pv,pp,e) {
    const tolerancia = 0.0001;  
    let t = 0.1; // Palpite inicial
    let t0 = 0.0;

    let funcao = 0; 
    let derivada = 0;
    let i = 0;
    
    while(Math.abs(t0 - t) >= tolerancia){
        t0 = t;
        funcao = calcularValorFuncao(np, pv, pp, t, e);
        derivada = calcularValorDerivadaFuncao(np, pv, pp, t, e);
        t = t - (funcao / derivada);
        i++;
    }
   
    return t;
}

function calcularValorFuncao(np, pv, pp, t, e){
    let a = 0; 
    let b = 0; 
    let c = 0;

    if(e) {
        a = Math.pow(1 + t, np - 2);
        b = Math.pow(1 + t, np - 1);
        c = Math.pow(1 + t, np);

        return (pv * t * b) - (pp/np * (c - 1));
    }
    else {
        a = Math.pow(1 + t, -np);
        b = Math.pow(1 + t, -np - 1);

        return (pv * t) - ( (pp / np) * (1 - a) ); 
    }
}
    
function calcularValorDerivadaFuncao(np, pv, pp, t, e){
    let a = 0; 
    let b = 0;

    if(e) {
        a = Math.pow(1 + t, np-2);
        b = Math.pow(1 + t, np - 1);

        return pv * (b + (t * a * (np - 1) ) ) - (pp * b);  
    }
    else {
        a = Math.pow(1 + t, -np);
        b = Math.pow(1 + t, -np - 1);

        return pv - (pp * b);
    }
}

function calculateFinancingCoefficient(t, np) {
    let taxaCorrigida = t / 100;
    return taxaCorrigida / (1 - Math.pow(1+taxaCorrigida, -np) );
}

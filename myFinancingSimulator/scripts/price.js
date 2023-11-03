/* --- Recuperando e validando os parâmetros da URL --- */

let params = new URLSearchParams(window.location.search);

let priceTableData = null;

if(params.get("np") != null && 
    params.get("tax") != null && 
    params.get("pv") != null && 
    params.get("pp") != null && 
    params.get("pb") != null) {

    // O parâmetro "dp" indica se existe entrada, e é opcional.
    let existeEntrada = params.get("dp") != null ? true : false;

    priceTableData = calculatePriceTable(params.get("np"), params.get("tax"), params.get("pv"), params.get("pp"), params.get("pb"), existeEntrada);
} 
else {
    throw new UserException("DadosInvalidos");
}

/* --- Gerando a tabela dinamicamente --- */

const table = document.getElementById("price-table");

priceTableData.forEach(rowData => {
    table.appendChild(createTableRow(rowData));
});


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

function calculatePriceTable(np, pv, pp, t, e) {

    let jurosReal = calculateInterestRate(np,pv,pp,e) * 100;
    let pmt = (pv * calculateFinancingCoefficient(jurosReal,np)).toFixed(2);
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
        juros = (saldoDevedor * jurosUsado / 100).toFixed;
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
    return taxaCorrigida / (1 - Math.pow(1 + taxaCorrigida, (-1) * np) );
}

const connection = require('../database/connection')
const fs = require('fs');
const csv = require('csv-parser');
const { response } = require('express');

module.exports = {

    async validarDados(req,res){
        let error = []
        let arrayResults = []
        let data = req.body   
        let code = data.product_code
        
        await connection.query(`
            SELECT * FROM products WHERE code = ${code} limit 1
            `, function (err, rows) {

                            if (err) {
                                error.push('error na requisição, tente novamente') 
                            }
                        }).then( ( success) =>  arrayResults = [...arrayResults,success[0]])
         
        if(error.length !== 0){
            return res.json({erro: error})    
        }
        return res.json({array: arrayResults})       

    },
    async consultaDados(req,res){
        let error = []

        const results = await connection.query(`
        SELECT code,sales_price FROM products WHERE code < 1000
        `, function (err, rows) {
                        if (err) {
                            error.push('error na requisição, tente novamente')
                            return res.json({ erro: error })
                        }
                    })
        return res.json(results[0])         

    },
    async recebeDados(req, res) {

        let error = []
        const reqBody = req.body

        let data = []

        reqBody.forEach((e,i) =>{
            if(reqBody[i].product_code !== ''){
                data.push(reqBody[i]) 
            }
        })

        function isObjectEmpty(obj) {
            return Object.keys(obj).length === 0;
        }

        if (isObjectEmpty(data)) {

            error.push('Sem dados, tente novamente')
            return res.json({ erro: error })
        }

        const results = await connection.query(`SELECT * from products`, function (err, rows) {
            if (err) {
                error.push('error na requisição, tente novamente')
                return res.json({ erro: error })
            }
        })

        let filterResults = []

        data.forEach(async (e, i) => {

            let code = data[i].product_code
            let salesPrice = data[i].new_price

            filterResults.push(results[0].filter((e) => e.code == code))

            if (filterResults[i].length == 0) {
                error.push(`Produto ${code} não encontrado`)
            }

            let costDebug = filterResults[i][0].cost_price || 0

            if (parseFloat(salesPrice) < parseFloat(costDebug)) {

                filterResults[i].forEach((e, i) => {
                    error.push(`item ${code} com preço de venda menor que o preço de custo`)
                })
            }

            let resultadoMenor = parseFloat(filterResults[i][0].sales_price) - (parseFloat(filterResults[i][0].sales_price) * 0.1)

            let resultadoMaior = parseFloat(filterResults[i][0].sales_price) + (parseFloat(filterResults[i][0].sales_price) * 0.1)

            if (salesPrice < resultadoMenor) {
                error.push(`item ${code} com preço de venda menor que 10% do preço atual`)
            }

            if (salesPrice > resultadoMaior) {
                error.push(`item ${code} com preço de venda maior que 10% do preço atual`)
            }

        });

        if (error.length !== 0) {
            return res.json({ erro: error })
        }

        return res.json({status:200})

    },
    async atualizarDados(req, res) {

        let error = []

        const data = req.body

        /*update */
        data.forEach(async (e, i) => {

            let code = data[i].product_code
            let salesPrice = data[i].new_price
            await connection.query(`
UPDATE products SET sales_price='${salesPrice}' WHERE code='${code}'
`, function (err, rows) {
                if (err) {
                    error.push('error na requisição, tente novamente')
                    return res.json({ erro: error })
                }
            })
        })

        /*pack*/

        const responseNumberPacks = await connection.query(`
    SELECT * FROM packs
`, function (err, rows) {
            if (err) {
                error = 'error na requisição, tente novamente'
                return res.json({ erro: error })
            }
        })

        let soma = []


        data.forEach(async (e, i) => {

            let code = data[i].product_code
            let salesPrice = data[i].new_price

            const result = responseNumberPacks[0].filter((e) => e.product_id == code)

            result.forEach((item, index) => {
                let resultSoma = result[index].qty * salesPrice

                soma.push({ pack_id: result[index].pack_id, soma: parseFloat(resultSoma) })

            })

        })

        let objetosUnicosVenda = soma.filter(
            (obj, index, self) =>
                index ===
                self.findIndex(
                    (otherObj) => JSON.stringify(otherObj) === JSON.stringify(obj)
                )
        );

        const resultadoSomaIdsPacks = objetosUnicosVenda.reduce((acumulador, objeto) => {
            const id = objeto.pack_id;
            const valor = objeto.soma;

            if (!acumulador[id]) {
                acumulador[id] = { id, valor };
            } else {
                acumulador[id].valor += valor;
            }

            return acumulador;
        }, {});

        const resultadoArray = Object.values(resultadoSomaIdsPacks);

        resultadoArray.forEach(async (e, i) => {

            await connection.query(`
            UPDATE products SET sales_price='${resultadoArray[i].valor}' WHERE code='${resultadoArray[i].id}'
        `, function (err, rows) {
                if (err) {
                    error.push('error na requisição, tente novamente')
                    return res.json({ erro: error })
                }
            })
        })
      return res.json({status:200})
    },
    async resultUpload(req, response) {

        if (!req.file) {
            console.log({ message: 'Nenhum arquivo enviado.' })
            return response.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const resultados = [];

        fs.createReadStream('./src/csv/atualizacao_preco_exemplo.csv')
            .pipe(csv())
            .on('data', (row) => {
                resultados.push(row);
            })
            .on('end', async (req, res) => {

                return response.json({ planilha: resultados })

            });

    }
}
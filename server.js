// imports
const { Client, LocalAuth, Buttons } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const saludoTiempo = require('./util/saludoTiempo')
const demora = require('./util/demora')
const mysql = require("mysql2/promise")
require("dotenv").config()

//bdd e inicializacion cliente chat
const client = new Client({
    authStrategy: new LocalAuth()
});
client.on('qr', qr => {
    console.log(qrcode.generate(qr, { small: true }))
})

client.on('ready', () => {
    console.log("Client is ready!")

})
client.initialize();

//declaración de variables globales
const regexDire1 = new RegExp(/[A-Za-z]+ [0-9]+/)
const regexDire2 = new RegExp(/[0-9]+ [A-Za-z]+/)
const regexName = new RegExp(/[A-ZÄËÏÖÜÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙ][a-zäÄëËïÏöÖüÜáéíóúáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñ]+ [A-ZÄËÏÖÜÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙ][a-zäÄëËïÏöÖüÜáéíóúáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñ]+/g)
let direcciones = []
let nombre;
const btnConfirmar = new Buttons("¿Desea confirmar su móvil? 👇", [{ body: "CONFIRMAR" }, { body: "CANCELAR" }])
const btnTipoViaje = new Buttons(`👋 ${saludoTiempo()}, seleccioná tu tipo de viaje.`, [{ body: "INMEDIATO" }, { body: "PROGRAMADO" }])
const btnOperadora = new Buttons("Si necesitas comunicarte con la operadora hace click en el siguiente botón 👇.", [{ body: "OPERADORA" }])
let numerosEnAtencion = []
let contador = 0
//cliente escuchando mensajes
client.on('message', async message => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    })
    if ((message.id.remote.includes("@c") && !numerosEnAtencion.find(numero => numero.numero === message.from)) && (message.type === "chat" || message.type === "buttons_response")) {
        if (message.body.toLowerCase().includes("hol") || message.body.toLowerCase().includes("bueb") || message.body.toLowerCase().includes("buen ") || message.body.toLowerCase().includes("buena") || message.body.toLowerCase().includes("necesit") || message.body.toLowerCase().includes("manda") || message.body.toLowerCase().includes("quiero") || message.body.toLowerCase().includes("mánda") || message.body.toLowerCase().includes("buenos") || message.body.toLowerCase().includes("necesito") || message.body.toLowerCase().includes("remis") || message.body.toLowerCase().includes("solicito") || message.body.toLowerCase().includes("enviame") || message.body.toLowerCase().includes("movil") || message.body.toLowerCase().includes("auto") || message.body.toLowerCase().includes("móvil")) {
            nombre = message._data.notifyName
            if (nombre.match(regexName)) {
                const btnTipoViajeName = new Buttons(`👋 ${saludoTiempo()} *${nombre.match(regexName)[0]}*, seleccioná tu tipo de viaje 👇`, [{ body: "INMEDIATO" }, { body: "PROGRAMADO" }])
                client.sendMessage(message.from, btnTipoViajeName)
            }
            else {
                client.sendMessage(message.from, btnTipoViaje)
            }
        }
        else if (message.body.toLowerCase() === "inmediato") {
            client.sendMessage(message.from, "Ingresá la dirección donde queres tu móvil en *UN SOLO MENSAJE.* 👇\n*Calle + número* (Por ejemplo: *Belgrano 2204*).")
        }
        else if (regexDire1.test(message.body) || regexDire2.test(message.body)) {
            direcciones.push({ mensaje: message.body, numero: message.from })
            message.reply(`⚠️ Su móvil tiene ${demora()} de demora.`)
            client.sendMessage(message.from, btnConfirmar)
        }
        else if (message.body.toLowerCase().includes("cancel") || Number(message.body) === 2) {
            direcciones = direcciones.filter((direccion) => !(direccion.numero === message.from))
            const numeroEnBD = await connection.query(`SELECT id, direccion, fecha FROM viajes WHERE telefono= '${message.from}' ORDER BY id DESC LIMIT 1`)
            if(numeroEnBD[0].length === 0){
                client.sendMessage(message.from, "Su viaje fue cancelado ❌\nGracias por comunicarse con Profesional Remis 🚕")
                client.sendMessage(message.from, btnOperadora)
            }
            else{
                await connection.query(`UPDATE viajes SET estado='CANCELADO' where id = ${numeroEnBD[0][0].id}`)
                client.sendMessage(message.from, "Su viaje fue cancelado ❌\nGracias por comunicarse con Profesional Remis 🚕")
                client.sendMessage(message.from, btnOperadora)
            }
        }
        else if (message.body.toLowerCase().includes("confirm") || Number(message.body) === 1) {
            contador++
            const horaDeCarga = new Date().toLocaleString("zu-ZA")
            const direccionBD = direcciones.filter(direccion => direccion.numero === message.from)
            direcciones = direcciones.filter((direccion) => !(direccion.numero === message.from))
            if (direccionBD.length > 1) {
                await connection.query(`INSERT INTO viajes (direccion, fecha, telefono) VALUES('${direccionBD[direccionBD.length - 1].mensaje}', '${horaDeCarga}', '${message.from}')`)
            }
            else {
                await connection.query(`INSERT INTO viajes (direccion, fecha, telefono) VALUES('${direccionBD[0].mensaje}', '${horaDeCarga}', '${message.from}')`)
            }
            client.sendMessage(message.from, "Su móvil va en camino ☑️\nGracias por comunicarse con Profesional Remis 🚕")
        }
        else if (message.body.toLowerCase().includes("gracias") || message.body.toLowerCase().includes("ok") || message.body.toLowerCase() === "bueno") {
            client.sendMessage(message.from, "Gracias por comunicarse con Profesional Remis 🚕!")
        }
        else if (message.body.toLowerCase() === "operadora" || message.body.toLowerCase() === "programado") {
            numerosEnAtencion.push({ numero: message.from, horaDeEntrada: new Date().getTime() })
            client.sendMessage(message.from, "Aguardá un momento, la operadora te escribirá en unos minutos...⏳")
            await (await message.getChat()).markUnread()
        }
        else {
            console.log(message.type)
            message.reply("⚠️Disculpa, no entendimos tu mensaje. Por favor intentá de nuevo!\nVerificá alguno de los siguientes campos:  \n➡️ Asegurá que la dirección cumpla con el formato indicado.\n➡️ Revisá que tu nombre este bien escrito.")
            client.sendMessage(message.from, btnOperadora)
        }
    }
})

setInterval(() => {
    numerosEnAtencion = numerosEnAtencion.filter(numero => ((new Date().getTime() - numero.horaDeEntrada) <= 600000))
}, 60000)

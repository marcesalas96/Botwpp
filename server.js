// imports
const { Client, LocalAuth, Buttons, MessageAck } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const saludoTiempo = require('./util/saludoTiempo')
const demora = require('./util/demora')

//bdd e inicializacion cliente chat
const client = new Client({
    authStrategy: new LocalAuth()
})
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
let dirección;
let nombre;
const btnConfirmar = new Buttons("¿Desea confirmar su móvil? 👇",[{body: "CONFIRMAR"},{body: "CANCELAR"}])
const btnTipoViajeName = new Buttons(`👋 ${saludoTiempo()}, *${nombre.match(regexName)[0]}*. Seleccioná tu tipo de viaje 👇`,[{body: "INMEDIATO"},{body: "PROGRAMADO"}])
const btnTipoViaje = new Buttons(`👋 ${saludoTiempo()}, seleccioná tu tipo de viaje 👇`,[{body: "INMEDIATO"},{body: "PROGRAMADO"}])
const btnOperadora = new Buttons("Si necesitas comunicarte con la operadora hace click en el siguiente botón 👇.", [{body: "OPERADORA"}])
let numerosEnAtencion = []
//cliente escuchando mensajes
client.on('message',async message => {
    if (message.id.remote.includes("@c") && !numerosEnAtencion.find(numero => numero.numero === message.from)) {
        if (message.body.toLowerCase().includes("hol") || message.body.toLowerCase().includes("bueb") || message.body.toLowerCase().includes("buen ") || message.body.toLowerCase().includes("buena") || message.body.toLowerCase().includes("necesit") || message.body.toLowerCase().includes("manda") || message.body.toLowerCase().includes("quiero") || message.body.toLowerCase().includes("mánda") || message.body.toLowerCase().includes("buenos") || message.body.toLowerCase().includes("necesito") || message.body.toLowerCase().includes("remis") || message.body.toLowerCase().includes("solicito") || message.body.toLowerCase().includes("enviame") || message.body.toLowerCase().includes("movil")|| message.body.toLowerCase().includes("auto")){
            nombre = message._data.notifyName
            if (nombre.match(regexName)) {
                client.sendMessage(message.from, btnTipoViajeName)
            }
            else {
                client.sendMessage(message.from, btnTipoViaje)
            }
        }
        else if (regexDire1.test(message.body) || regexDire2.test(message.body)) {
            dirección = message.body
            message.reply(`⚠️ Su móvil tiene ${demora()} mins de demora.`)
            client.sendMessage(message.from, btnConfirmar)
        }
        else if (message.body.toLowerCase().includes("cancel") || Number(message.body) === 2) {
            client.sendMessage(message.from, "Su móvil fue cancelado ❌\nGracias por comunicarse con Profesional Remis 🚕!")
            client.sendMessage(message.from, btnOperadora)
        }
        else if (message.body.toLowerCase().includes("confirm") || Number(message.body) === 1) {
            client.sendMessage(message.from, "Su móvil va en camino ☑️\nGracias por comunicarse con Profesional Remis 🚕!")
            client.sendMessage(message.from, btnOperadora)
        }
        else if (message.body.toLowerCase().includes("gracias") || message.body.toLowerCase().includes("ok") || message.body.toLowerCase() === "bueno"){
            client.sendMessage(message.from, "Gracias por comunicarse con Profesional Remis 🚕!")
        }
        else if(message.body.toLowerCase() === "operadora" || message.body.toLowerCase() === "programado") {
            numerosEnAtencion.push({numero: message.from, horaDeEntrada: new Date().getTime()})
            //CODIGO QUE MANDE ALERTA A LA INTERFAZ
            client.sendMessage(message.from, "Aguardá un momento, la operadora te escribirá en unos minutos...⏳")
            await (await message.getChat()).markUnread()
        }
        else {
            message.reply("⚠️Disculpa, no entendimos tu mensaje. \nPor favor intentá de nuevo!\nVerificá alguno de los siguientes campos:  \n➡️ Asegurá que la dirección cumpla con el formato indicado.\n➡️ Revisá que tu nombre este bien escrito.")
            client.sendMessage(message.from, btnOperadora)
        }
    }
})

setInterval(()=> {
    numerosEnAtencion = numerosEnAtencion.filter(numero => ((new Date().getTime() - numero.horaDeEntrada) <= 300000))
},60000)

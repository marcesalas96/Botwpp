module.exports = saludoTiempo = () => {
    const hora = new Date().getHours()
    if (hora > 7 && hora < 12 ){
        return("Buen día")
    }
    else if(hora > 12 && hora < 20){
        return("Buenas tardes")
    }
    else{
        return("Buenas noches")
    }
}

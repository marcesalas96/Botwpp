module.exports = demora = () => {
    const hora = new Date().getHours()
    if (hora > 7 || hora < 11 ){
        return("15 a 20 minutos")
    }
    else if(hora > 17 && hora < 20){
        return("15 a 20 minutos")
    }
    else{
        return("10 minutos")
    }
}
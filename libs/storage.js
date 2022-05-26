const fs = require('fs')

class Storage{
    contactExists(contact){
        try {
            if (fs.existsSync('clientes/'+contact+'.json')) {
                return true;
            }else{
                return false;
            }
        } catch(err) {
            return false;
        }
    }

    contactRead(contact){
        try {
            return JSON.parse(fs.readFileSync('clientes/'+contact+'.json'));
        } catch(err) {
            return false;
        }
    }


    contactWrite(contact,data){
        try {
            return fs.writeFileSync('clientes/'+contact+'.json',JSON.stringify(data));
        } catch(err) {
            return false;
        }
    }

}

module.exports = Storage;
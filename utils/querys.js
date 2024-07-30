const { executeQuery, executeQuery2 } = require("../db/database");

async function excludeAdvisors (excludeAdvisorsArray) {
    try {
        const query = 'select idAuth from users where roleId != 3';
        const rows = await executeQuery(query);
        const newExcludeAdvisorsArray = ['1039'];

        for (const row of rows) {
            const { idAuth } = row;
            const idAuthString = String(idAuth);
            newExcludeAdvisorsArray.push(idAuthString);
        }

        excludeAdvisorsArray = excludeAdvisorsArray.filter(item => newExcludeAdvisorsArray.includes(item) && !excludeAdvisorsArray.includes(item));

        if (!newExcludeAdvisorsArray.includes(excludeAdvisorsArray)) {
            excludeAdvisorsArray.push(...newExcludeAdvisorsArray);
        }
    
        // console.log("No son asesores: ", excludeAdvisorsArray)
        return excludeAdvisorsArray;
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
    }
}

async function queue (arregloDidQueue) {
    try {
        const query = 'select id, did, queue from dids';
        const rows = await executeQuery(query);
 
        for (const row of rows) {
            const { id, did, queue } = row;
            const queueString = String(queue);
            arregloDidQueue.push({ id, did, queueString });
        }
    
        // console.log('Arreglo did funcion', arregloDidQueue);
        return arregloDidQueue
    } catch (error) {
        console.error('Error al obtener la cola (queue) para el DID:', error);
    }
}

async function members (membersQueue) {
    try {
        const rows = await executeQuery2('SELECT queue_name, membername from queue_members')

        for (const row of rows) {
            const { queue_name, membername } = row;
            const queue = String(queue_name);
            membersQueue.push({ queue, membername });
        }

        // console.log('Members queue:', membersQueue)
        return membersQueue
    } catch (error) {
        console.log('Error al obtener members queue:', error)
    }
} 

async function searchPrefijo (usersPrefijo) {
    try {
        const query = 'select u.idAuth, t.prefijo, t.endpoint from users u JOIN troncales t ON u.idTroncal = t.id where u.roleId = 3';
        const rows = await executeQuery(query);

        for (const row of rows) {
            const { idAuth, prefijo, endpoint } = row;
            const idnumber = String(idAuth);
            usersPrefijo.push({ idnumber, prefijo, endpoint });
        }

        // console.log('Asesores Prefijo: ', usersPrefijo);
        return usersPrefijo
    } catch (error) {
        console.error('Error al obtener el prefijo de los asesores: ', error);
    }
}

module.exports = {excludeAdvisors, queue, members, searchPrefijo};
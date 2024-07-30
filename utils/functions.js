function findQueuesForMember(membersQueue, membername) {
    const queues = membersQueue.filter(member => member.membername === membername).map(member => member.queue);
    return queues.length ? queues : null;
}
  
function findIdForQueue(arregloDidQueue, queue) {
    const entry = arregloDidQueue.find(item => item.queueString === queue);
    return entry ? entry.id : null; 
}
  
function findPrefijo(usersPrefijo, idAuth) {
    const prefijoObj = usersPrefijo.find(i => i.idnumber === idAuth);
    if (prefijoObj) {
        return { prefijo: prefijoObj.prefijo, endpoint: prefijoObj.endpoint };
    } else {
        return { prefijo: '238151', endpoint: 'itelvox-s' };
    }
}

function removePrefix(number) {
    if (/^51/.test(number)) {
        return number.replace(/^51/, '');
    } else {
        return number;
    }
}

function parseAMIEvent(event) {
    const parsedEvent = {};
    const lines = event.split('\r\n');
  
    for (const line of lines) {
      const match = line.match(/^([^:]+): (.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        parsedEvent[key] = value;
      }
    }
    return parsedEvent;
}

const stateFieldMap = {
    'En Línea': 'time_online',
    'Rellenando Ficha': 'time_filling_form',
    'Baño': 'time_bath',
    'En Break': 'time_break',
    'Formación': 'time_formatition',
    'Sesíon de Supervisor': 'time_supervisor',
    'En Llamada': 'time_call',
};

const selectQuery = `
    SELECT c.id, c.number, d.did, c.firtsCalltype, dp.marcaciones_asesor
        FROM asteriskcdr.call_me c
            JOIN asteriskcdr.dids d ON c.didId = d.id
            JOIN asteriskcdr.dialPlanOrigin dp ON c.didId = dp.didId
        WHERE c.status = 1
            AND c.on_call = 0
            AND c.connected_call != 1
            AND c.didId = ?
            AND (
                (dp.soloHoy = TRUE AND DATE(CONVERT_TZ(c.createdAt, '+00:00', '-05:00')) = CURDATE())
                OR
                (dp.soloHoy = FALSE AND c.createdAt >= CONVERT_TZ(NOW() - INTERVAL dp.cicloVida_horas HOUR, '+00:00', '-05:00'))
                )
            AND (
                (TIMESTAMPDIFF(MINUTE, CONVERT_TZ(c.updatedAt, '+00:00', '-05:00'), NOW()) >= dp.intervaloEntreIntentos_min AND c.attempts < dp.intentosmaximos)
                OR
                (TIMESTAMPDIFF(MINUTE, CONVERT_TZ(c.updatedAt, '+00:00', '-05:00'), NOW()) < dp.intervaloEntreIntentos_min AND c.attempts < dp.intentosCiclo)
                )
        ORDER BY c.attempts ASC, c.createdAt DESC
        LIMIT 1
    `;

module.exports = {findQueuesForMember, findIdForQueue, findPrefijo, removePrefix, stateFieldMap, parseAMIEvent, selectQuery};
const { Sequelize } = require("sequelize");
const { counts_calls } = require("../model/countAgent_model");
const { did } = require("../model/dids_model");
const { user } = require("../model/users_model");
const { Op } = require("sequelize");

async function searchDidId(queue) {
    const searchDidId = await did.findOne({
      where: { queue: queue }
    });
    
    const identifier = searchDidId ? searchDidId.identifier : null;
  
    let didId = null;
    let SearchQueue = null;
  
    if (identifier) {
      const searchPerdida = await did.findOne({
        where: {
          queue: { [Sequelize.Op.like]: `%Perdida%` },
          identifier
        }
      });
  
      if (searchPerdida) {
        didId = searchPerdida.id;
        SearchQueue = searchPerdida.queue;
      }
    }
  
    return { didId, SearchQueue };
}

async function searchAgent (idAuth) {
    console.log('id_auth: ', idAuth);
  
    if (!idAuth) {
      throw new Error('The idAuth parameter is required and cannot be undefined or null.');
    }
  
    return await user.findOne({
        where: {
            idAuth,
        }
    })
}

const existsAgent = async (id_agent) => {
    console.log('id_agent:', id_agent); // Check the value of id_agent
  
    if (!id_agent) {
      throw new Error('The id_agent parameter is required and cannot be undefined or null.');
    }
  
    return await counts_calls.findOne({
      where: {
        id_agent,
        createdAt: {
          [Op.between]: [
            new Date().setHours(0,0,0,0),
            new Date().setHours(23,59,59,999)
          ]
        }
      }
    });
};  

const stateFieldMap = {
    'En Línea': 'time_online',
    'Rellenando Ficha': 'time_filling_form',
    'Baño': 'time_bath',
    'En Break': 'time_break',
    'Formación': 'time_formatition',
    'Sesíon de Supervisor': 'time_supervisor',
    'En Llamada': 'time_call',
  };
  
  async function handleCall (parsedEvent, callTypes) {
    
    const createdAt = new Date();
    const id_agentcall = parsedEvent.ConnectedLineNum
    let answerType;
    const callType = callTypes.toLowerCase();

    if (callType === 'salientes') {
      answerType = 'answer_outbound';

    } else if (callType.includes('entrante') || callType.includes('fija') && !callType.includes('callme') && !callType.includes('perdidas') && !callType.includes('base') || callType.includes('atc') || callType.includes('movil') && !callType.includes('callme') && !callType.includes('perdidas') && !callType.includes('base') || callType.includes('consulta')) {
      
      answerType = 'answer_inbound';

    } else if (callType.includes('perdidas') || callType.includes('(callme)') || callType.includes('base') || callType.includes('blending') || callType.includes('carga-de-lotes')) {

      if (callType.includes('perdidas')) {
        answerType = 'answer_losses';
      } else if (callType.includes('callme')) {
        answerType = 'answer_callme';
      } else if (callType.includes('base') || callType.includes('blending')) {
        answerType = 'answer_base';
      }
    } 

    const agents = await existsAgent(id_agentcall);

    const updateData = {
      total_answer: Sequelize.literal('`total_answer` + 1'),
      updatedAt: createdAt,
    };  

    updateData[answerType] = Sequelize.literal(`\`${answerType}\` + 1`);

    if (agents) {
      counts_calls.update(updateData, {where: {id: agents.id}});
    } else {

      const agentSearch = await searchAgent(id_agentcall);

      counts_calls.create({
        id_agent: id_agentcall,
        agent: agentSearch.name,
        total_answer: 1,
        [answerType]: 1,
        createdAt,
        updatedAt: createdAt
      });
    }
}

async function handleCall2 (evt, callTypes) {
    
  const createdAt = new Date();
  const id_agentcall = evt.connectedlinenum
  let answerType;
  const callType = callTypes.toLowerCase();

  if (callType === 'salientes') {
    answerType = 'answer_outbound';

  } else if (callType.includes('entrante') || callType.includes('fija') && !callType.includes('callme') && !callType.includes('perdidas') && !callType.includes('base') || callType.includes('atc') || callType.includes('movil') && !callType.includes('callme') && !callType.includes('perdidas') && !callType.includes('base') || callType.includes('consulta')) {
    
    answerType = 'answer_inbound';

  } else if (callType.includes('perdidas') || callType.includes('(callme)') || callType.includes('base') || callType.includes('blending') || callType.includes('carga-de-lotes')) {

    if (callType.includes('perdidas')) {
      answerType = 'answer_losses';
    } else if (callType.includes('callme')) {
      answerType = 'answer_callme';
    } else if (callType.includes('base') || callType.includes('blending')) {
      answerType = 'answer_base';
    }
  } 

  const agents = await existsAgent(id_agentcall);

  const updateData = {
    total_answer: Sequelize.literal('`total_answer` + 1'),
    updatedAt: createdAt,
  };  

  updateData[answerType] = Sequelize.literal(`\`${answerType}\` + 1`);

  if (agents) {
    counts_calls.update(updateData, {where: {id: agents.id}});
  } else {

    const agentSearch = await searchAgent(id_agentcall);

    counts_calls.create({
      id_agent: id_agentcall,
      agent: agentSearch.name,
      total_answer: 1,
      [answerType]: 1,
      createdAt,
      updatedAt: createdAt
    });
  }
}

module.exports = { searchDidId, searchAgent, existsAgent, handleCall, handleCall2 };
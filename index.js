import Fastify from "fastify";
import fs from 'fs';
import fastifyCors from '@fastify/cors';

let fastify = Fastify();

fastify.register(fastifyCors, { 
    methods:["POST", "GET"],
    origin:"*"
})


const dbFile = 'db.json';
let db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

function dbSave() { return fs.writeFileSync(dbFile, JSON.stringify(db, null, 2)) }
function RandomID () { return Math.random().toString(32).replace('.', '') };
function ShortID () { return RandomID().slice(-6) };




fastify.get("/removedb", async (req, reply)=>{
    db = {};
    dbSave();
    reply.send({ok:true});
})



fastify.get("/table/create", async (req, reply)=>{
    let uid = ShortID();
    db[uid] = {
        title:req.query.name,
        columns: [
            { name: 'Задачи', tasks: [], main: true, color: 'primary' },
            { name: 'В работе', tasks: [], main: false, color: 'secondary' },
            { name: 'Тестируются', tasks: [], main: false, color: 'warning' },
            { name: 'Выполненно', tasks: [], main: false, color: 'success' }
        ]
    };
    dbSave();
    reply.send({id:uid})
})

fastify.get("/table/get", async (req, reply)=>{
    if (!db[req.query.id]) {
        reply.status(404).send({error:"Таблица не найдена", code:1})
    }else{
        reply.send(db[req.query.id])
    }
})

// Tasks
fastify.get("/task/create", async (req, reply)=>{
    if (!db[req.query.table_id]) {
        reply.status(404).send({error:"Таблица не найдена", code:1})
    }else{
        let {name, description} = req.query;
        if(name&&description){
            let task = {
                id:RandomID(),
                name,
                description,
                column:0
            };
            db[req.query.table_id].columns[0].tasks.push(task);
            dbSave();
            reply.send(task);
        }else{
            reply.status(400).send({error:"Не указанно имя (name) и/или описание (description)"})
        }
    }
})

fastify.get("/task/delete", async (req, reply)=>{
    if (!db[req.query.table_id]) {
        reply.status(404).send({error:"Таблица не найдена", code:1})
    }else{
        for (const column of db[req.query.table_id].columns) {
            const finded = column.tasks.find((data) => data.id == req.query.id);
            if (finded) {
                const index = column.tasks.indexOf(finded);
                column.tasks.splice(index, 1);
                dbSave();
                reply.send(db[req.query.table_id]);
            }
        }
        reply.status(404).send({error:"Таск не найден", code:2})
    }
})

fastify.get("/task/move", async (req, reply)=>{
    if (!db[req.query.table_id]) {
        reply.status(404).send({error:"Таблица не найдена", code:1})
    }else{
        let {position} = req.query;
        if(position){
            for (const column of db[req.query.table_id].columns) {
                const finded = column.tasks.find((data) => data.id == req.query.id);
                if (finded) {
                    const index = column.tasks.indexOf(finded);
                    const temp = column.tasks[index];
                    temp.column = position;
                    column.tasks.splice(index, 1);
                    db[req.query.table_id].columns[+position].tasks.push(temp);
                    dbSave();
                    reply.send(db[req.query.table_id]);
                }
            }
            reply.status(404).send({error:"Таск не найден", code:2})
        }else{
            reply.status(400).send({error:"Не указанна таблица (position)"})
        }
    }
})

fastify.get("/task/change", async (req, reply)=>{
    if (!db[req.query.table_id]) {
        reply.status(404).send({error:"Таблица не найдена", code:1})
    }else{
        let {description} = req.query;
        for (const column of db[req.query.table_id].columns) {
            const finded = column.tasks.find((data) => data.id == req.query.id);
            if (finded) {
                const index = column.tasks.indexOf(finded);
                column.tasks[index].description=description;
                dbSave();
                reply.send(db[req.query.table_id]);
            }
        }
        reply.status(404).send({error:"Таск не найден", code:2})
    }
})

fastify.setErrorHandler(function (error, request, reply) {
    // Log error
    console.log(error)
    // Send error response
    reply.status(409).send({ ok: false })
})


fastify.listen({
    host:"0.0.0.0",
    port:1213
})




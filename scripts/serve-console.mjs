import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const base=resolve(fileURLToPath(new URL('../apps/console/',import.meta.url)));
const assets=new Map([
  ['/','index.html'],['/index.html','index.html'],
  ['/styles.css','styles.css'],['/app.mjs','app.mjs'],
  ['/fixtures.mjs','fixtures.mjs'],['/model.mjs','model.mjs'],
]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const csp="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
const chosen=Number(process.env.FORGE_CONSOLE_PORT??4173);
if(!Number.isInteger(chosen)||chosen<1025||chosen>65535)throw new Error('FORGE_CONSOLE_PORT must be between 1025 and 65535');
const server=createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',csp);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let pathname;
  try{const url=new URL(req.url,'http://127.0.0.1');pathname=url.pathname;}catch{res.writeHead(400);res.end();return;}
  const file=assets.get(pathname);
  if(!file){res.writeHead(404);res.end();return;}
  try{
    const body=await readFile(resolve(base,file));
    res.writeHead(200,{'Content-Type':mime[file.slice(file.lastIndexOf('.'))]});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(500);res.end();}
});
server.listen(chosen,'127.0.0.1',()=>console.log(
  'Forge UI DESIGN PREVIEW (fixtures only): http://127.0.0.1:'+chosen+
  '\nNo Runtime, Sentinel, credentials, external network calls or execution.'
));

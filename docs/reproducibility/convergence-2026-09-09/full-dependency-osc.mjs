// Real locked osc codec and bridge event path; no sockets are opened.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {root,sourceRevision,outputDirectory} from './verify-source.mjs';
const requireCore=createRequire(path.join(root,'packages/core-engine/package.json'));
const osc=requireCore('osc');
const {OSCBridge}=await import(pathToFileURL(path.join(root,'packages/core-engine/src/osc/osc-bridge.ts')));
const originalOpen=osc.UDPPort.prototype.open;
const observations=[];
try {
  for (const [name,args,expected] of [
    ['float',[{type:'f',value:0.5}],[0.5]],
    ['integer',[{type:'i',value:7}],[7]],
    ['string',[{type:'s',value:'synthetic'}],['synthetic']],
    ['true',[{type:'T'}],[true]],
    ['false',[{type:'F'}],[false]],
    ['null',[{type:'N'}],[null]],
    ['empty',[],[]],
    ['multiple',[{type:'f',value:0.5},{type:'s',value:'synthetic'}],[0.5,'synthetic']],
  ]) {
    let port;
    osc.UDPPort.prototype.open=function(){port=this;this.emit('ready');};
    const bridge=new OSCBridge({enabled:true,addressPrefix:'/omni'});
    const received=[];
    bridge.on('message',message=>received.push(message));
    await bridge.connect();
    const bytes=osc.writeMessage({address:'/omni/intensity',args},{metadata:true});
    const decoded=osc.readMessage(bytes,{metadata:true,unpackSingleArgs:true});
    port.emit('message',decoded);
    assert.deepEqual(received,[{address:'/omni/intensity',parameter:'intensity',args:expected}]);
    observations.push({name,input:args,decodedArgumentShape:Array.isArray(decoded.args)?'array':'scalar',received:received[0],passed:true});
  }
} finally { osc.UDPPort.prototype.open=originalOpen; }
const output={sourceRevision,executionClass:'full_locked_dependency_committed_source',generatedAt:new Date().toISOString(),oscVersion:requireCore('osc/package.json').version,socketOpening:'stubbed; no sockets opened',passedCases:observations.length,observations};
fs.writeFileSync(path.join(outputDirectory,'full-dependency-osc.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));

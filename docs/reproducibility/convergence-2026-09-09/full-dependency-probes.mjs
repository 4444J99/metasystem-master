// Mechanically retained historical fixture logic; actual locked modules replace isolated loader.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root, sourceRevision, outputDirectory} from './verify-source.mjs';
const w=await import(pathToFileURL(path.join(root,'packages/core-engine/src/consensus/weighted-voting.ts')));
const t=await import(pathToFileURL(path.join(root,'packages/core-engine/src/types/index.ts')));
const NOW = 1800000000000;
const stage = {x:50,y:0};
const C = t.DEFAULT_WEIGHTING_CONFIG;
function inputs(values) { return values.map((value,i)=>({id:`input-${i}`,clientId:`client-${i}`,sessionId:'synthetic',parameter:'intensity',timestamp:NOW,value,location:stage})); }
function result(xs, cfg=C, previous=undefined, mode=t.ConsensusMode.WEIGHTED_AVERAGE) { return w.computeConsensus('intensity',xs,stage,cfg,previous,mode,NOW); }
const minority=[];
for(let count=1; count<=50; count++) for(const threshold of [1,2,2.5,3,Infinity]) for(const gamma of [0,0.2]) {
  const xs=inputs([...Array(100-count).fill(0),...Array(count).fill(1)]);
  const cfg={...C,outlierThreshold:threshold,consensusGamma:gamma};
  const weighted=w.weightInputs(xs,stage,cfg,NOW);
  const filtered=w.removeOutliers(weighted,threshold);
  minority.push({minorityCount:count,threshold,consensusGamma:gamma,
    retainedMinority:filtered.filter(x=>x.value===1).length,retainedTotal:filtered.length,
    retainedIds:filtered.map(x=>x.id),meanBeforeFilter:w.weightedMean(weighted),result:result(xs,cfg)});
}
const temporal=[-5000,-1,0,4999,5000,5001,10000].map(age=>({ageMs:age,weight:w.calculateTemporalWeight(NOW-age,NOW,C)}));
const base={performerId:'synthetic-performer',parameter:'intensity',value:0.9,mode:'absolute'};
const expiry=[undefined,0,NOW-1,NOW,NOW+1].map(expiresAt=>({expiresAt:expiresAt??'absent',active:w.isOverrideActive({...base,...(expiresAt===undefined?{}:{expiresAt})},NOW)}));
const overrideModes=['absolute','blend','lock'].map(mode=>({mode,result:w.applyOverride(0.1,{...base,mode})}));
const invalid=[];
const probes=[['zero_window',{temporalWindowMs:0},undefined],['negative_window',{temporalWindowMs:-1},undefined],['nan_coefficient',{spatialAlpha:NaN},undefined],['negative_outlier_threshold',{outlierThreshold:-1},undefined],['smoothing_factor_2',{smoothingFactor:2},0]];
for(const [name,change,previous] of probes) {
  try {const r=result(inputs([0.8,0.8,0.8,0.8]),{...C,...change},previous); invalid.push({name,change,threw:false,result:r,finite:Number.isFinite(r.value),inUnitInterval:r.value>=0&&r.value<=1});}
  catch(e){invalid.push({name,change,threw:true,error:String(e)});}
}
const evenMedian=result(inputs([0,0.2,0.8,1]),C,undefined,t.ConsensusMode.MEDIAN);
const majorityTies=[[0,0,1,1],[1,1,0,0]].map(values=>({values,result:result(inputs(values),C,undefined,t.ConsensusMode.MAJORITY_VOTE)}));
// Harness sanity checks are not the repository's tests or assertions of policy suitability.
assert.equal(temporal.find(x=>x.ageMs===-1).weight,1);
assert.equal(expiry.find(x=>x.expiresAt===NOW).active,false);
assert.equal(minority.length,500);
assert.equal(expiry.find(x=>x.expiresAt===0).active,false);
const output={schemaVersion:'1.0',sourceRevision,generatedAt:new Date().toISOString(),executionClass:'full_locked_dependency_committed_source',runtime:{node:process.version,platform:process.platform,architecture:process.arch},assistantProduced:true,githubActionsExecuted:false,minority,temporal,expiry,overrideModes,invalid,evenMedian,majorityTies};
const replacer=(_key,value)=>typeof value==='number'&&!Number.isFinite(value)?String(value):value;
fs.writeFileSync(path.join(outputDirectory,'full-dependency-probes.json'),JSON.stringify(output,replacer,2)+'\n');
console.log(JSON.stringify({sourceRevision,minorityCases:minority.length,epochZeroActive:expiry.find(x=>x.expiresAt===0).active,temporal,invalid,evenMedian},replacer,2));

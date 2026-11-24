import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../../",import.meta.url));
const own="tests/criteria-facade-config/",out=own+".artifacts/resumed/";
const existing=["packages/heroui/src/filters/criteria-commit.tsx","packages/heroui/src/filters/criteria-commit-core.ts","packages/heroui/src/toolbar/criteria-tool-host.tsx"];
const addition="packages/heroui/src/filters/criteria-facade-config.tsx";
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const json=value=>`${JSON.stringify(value,null,2)}\n`;
async function walk(dir=""){
  const result={};
  for(const entry of await readdir(root+dir,{withFileTypes:true})){
    if([".git",".repo","node_modules"].includes(entry.name))continue;
    const path=dir+entry.name;
    if(path+"/"===out)continue;
    if(entry.isDirectory())Object.assign(result,await walk(path+"/"));
    else{assert.ok(entry.isFile(),path);result[path]={mode:(await stat(root+path)).mode.toString(8),sha256:sha(await readFile(root+path))};}
  }
  return result;
}
await mkdir(root+out,{recursive:true});
const now=await walk();
if(process.argv[2]==="snapshot"){
  const bytes=await readFile("/tmp/opencode/wp09-after-d2-export-audit-source133.json");
  assert.equal(sha(bytes),"cf4b36714107d270c0be26ed38a77cc87a456ae76ba8bba3b4a5d553f63d8ef7");
  const canonical=JSON.parse(bytes);assert.equal(Object.keys(canonical).length,133);
  for(const [path,value] of Object.entries(canonical)){
    assert.equal(now[path]?.sha256,value.sha256,path);
    assert.equal(Number.parseInt(now[path].mode,8)&0o111 ? "100755":"100644",value.mode,path);
  }
  await writeFile(root+out+"source133-before.json",bytes,{flag:"wx"});
  await writeFile(root+out+"stopped-README.md",await readFile(root+own+"README.md"),{flag:"wx"});
  const protectedFiles=Object.fromEntries(Object.entries(now).filter(([path])=>!existing.includes(path)&&path!==own+"README.md"));
  const protectedSources=Object.fromEntries(Object.keys(canonical).filter(path=>!existing.includes(path)).map(path=>[path,now[path]]));
  assert.equal(Object.keys(protectedSources).length,130);
  await writeFile(root+out+"protected-files.json",json(protectedFiles),{flag:"wx"});
  await writeFile(root+out+"protected-sources130.json",json(protectedSources),{flag:"wx"});
  for(const path of existing){await mkdir(root+out+"preimages/"+path.slice(0,path.lastIndexOf("/")),{recursive:true});await writeFile(root+out+"preimages/"+path,await readFile(root+path),{flag:"wx"});}
  const baseline={base:"bfb12c3 (main supplied; no Git read)",source133:sha(bytes),existing,addition,protectedFiles:Object.keys(protectedFiles).length,protectedFilesAggregate:sha(json(protectedFiles)),protectedSources:130,protectedSourcesAggregate:sha(json(protectedSources)),stoppedREADME:sha(await readFile(root+out+"stopped-README.md"))};
  await writeFile(root+out+"baseline.json",json(baseline),{flag:"wx"});process.stdout.write(json(baseline));
}else{
  const before=JSON.parse(await readFile(root+out+"protected-files.json","utf8"));
  const changed=Object.keys(before).filter(path=>JSON.stringify(before[path])!==JSON.stringify(now[path]));
  const extra=Object.keys(now).filter(path=>!(path in before)&&!existing.includes(path)&&path!==addition&&!path.startsWith(own));
  const result={protectedFiles:Object.keys(before).length,protectedSources:130,changed,extra};
  await writeFile(root+out+"scope.json",json(result));process.stdout.write(json(result));assert.deepEqual(changed,[]);assert.deepEqual(extra,[]);
}

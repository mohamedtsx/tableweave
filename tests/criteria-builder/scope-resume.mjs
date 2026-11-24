import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir,readFile,stat,writeFile } from "node:fs/promises";
import { relative,resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../../",import.meta.url)),own="tests/criteria-builder/";
const changed=["types.ts","filter-builder.tsx","option-owners.tsx","value-editors.tsx"].map(name=>`packages/heroui/src/filters/${name}`),added="packages/heroui/src/filters/criteria-builder-host.tsx";
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const original=await readFile("/tmp/opencode/wp09-before-builder-resume-source127.json");assert.equal(hash(original),"2361efaa0666c9c126437f9f7d1b490eb609d75a4b0c85a18dd3a8bbfe2156ed");const sources=JSON.parse(original);assert.equal(Object.keys(sources).length,127);
assert.equal(hash(await readFile("/tmp/opencode/wp09-before-builder-source127.json")),"8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2");
assert.equal(sources["packages/heroui/src/date/criteria-date-state.tsx"].sha256,"28ebb1a8181337a5aa9bfd867bebee621efaf75d67442f354d4aa982fea73aef");
assert.equal(hash(await readFile(new URL("./BLOCKER.md",import.meta.url))),"98f98e73e7d67dccf2c2353a071820538270c27c856a2c0cdf4ecccb61e9db2b");
async function walk(directory){const paths=[];for(const entry of await readdir(directory,{withFileTypes:true})){if(["node_modules",".git",".repo","dist","build",".artifacts","test-results","playwright-report"].includes(entry.name)||entry.name.startsWith(".env")||entry.name===".npmrc")continue;const path=resolve(directory,entry.name);if(entry.isDirectory())paths.push(...await walk(path));else if(entry.isFile())paths.push(relative(root,path));}return paths;}
async function inputs(){const paths=[...await walk(resolve(root,"packages")),...await walk(resolve(root,"tests")),...await walk(resolve(root,"docs")),...await walk(resolve(root,"product")),...await walk(resolve(root,".agents")),"AGENTS.md","PROJECT.md","README.md","package.json","pnpm-lock.yaml","pnpm-workspace.yaml","tsconfig.base.json","biome.json"].filter(path=>!changed.includes(path)&&path!==added&&(!path.startsWith(own)||path===`${own}BLOCKER.md`||path===`${own}check-baseline.mjs`)).sort();return Object.fromEntries(await Promise.all(paths.map(async path=>[path,{sha256:hash(await readFile(resolve(root,path))),mode:(await stat(resolve(root,path))).mode&0o777}])));}
const before=new URL("./resume-before.json",import.meta.url);
if(process.argv[2]==="before"){
  for(const [path,expected] of Object.entries(sources))assert.equal(hash(await readFile(resolve(root,path))),expected.sha256,path);
  await writeFile(before,`${JSON.stringify({sourceMapSha256:hash(original),excluded:[...changed,added,"TASKS.md (main bookkeeping)","own new fixtures/current README"],files:await inputs()},null,2)}\n`,{flag:"wx"});
  await writeFile(new URL("./resume-source-preimages.json",import.meta.url),`${JSON.stringify(Object.fromEntries(await Promise.all(changed.map(async path=>[path,await readFile(resolve(root,path),"utf8")]))),null,2)}\n`,{flag:"wx"});console.log("New resume baseline captured after explicit main README/BLOCKER bookkeeping; no historical map recaptured.");
}else{assert.deepEqual(await inputs(),JSON.parse(await readFile(before,"utf8")).files);for(const [path,expected] of Object.entries(sources)){const mode=(await stat(resolve(root,path))).mode;assert.equal(mode&0o111?"100755":"100644",expected.mode,path);if(!changed.includes(path))assert.equal(hash(await readFile(resolve(root,path))),expected.sha256,path);}console.log(`${Object.keys(JSON.parse(await readFile(before,"utf8")).files).length} protected inputs and 123 original-map-derived sources unchanged, including Date prerequisite, BLOCKER and original checker.`);}

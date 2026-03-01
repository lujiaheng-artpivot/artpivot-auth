
/* ════════════════════════════════════════════════════════════
   拟像 NI XIANG — 完整后端集成
   三套核心系统:
   1. 剧本大师 (juben) — Script Analysis + Generation
   2. CineLogic 导演专业版 — Storyboard Analysis + Image Gen
   3. CineStyle AI — Art Style Analysis + Concept Images + Chat
   所有后端均基于 Gemini REST API
════════════════════════════════════════════════════════════ */

/* ══════════════ SHARED: API KEY & GEMINI HELPERS ══════════════ */
function getApiKey(){ return sessionStorage.getItem('gemini_api_key')||''; }
function saveApiKey(){
  const v = document.getElementById('apiKeyInput').value.trim();
  if(!v){ showToast('Key 不能为空',''); return; }
  sessionStorage.setItem('gemini_api_key', v);
  document.getElementById('artApiKeyBanner').style.display='none';
  updateApiStatusPill();
  showToast('API Key 已保存','本次会话有效');
}
function promptApiKey(){
  const b = document.getElementById('artApiKeyBanner');
  b.style.display = b.style.display==='none' ? 'flex' : 'none';
}
function updateApiStatusPill(){
  const el = document.getElementById('artApiStatus');
  if(!el) return;
  if(getApiKey()){
    el.className='api-status-pill ok'; el.textContent='● Key 已配置';
  } else {
    el.className='api-status-pill none'; el.textContent='● 设置 API Key';
  }
}

async function geminiCall(model, contents, config={}){
  const key = getApiKey();
  if(!key) throw new Error('请先配置 Gemini API Key（在美术风格步骤中设置）');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = { contents, ...config };
  const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  if(!res.ok){ const e=await res.json(); throw new Error(e.error?.message||'API Error'); }
  return await res.json();
}

function extractText(data){ return data.candidates?.[0]?.content?.parts?.[0]?.text || ''; }

/* ══════════════ PAGE NAV ══════════════ */
function goPage(name){
  // Close any open modals
  closeAuth(); closeCheckout();
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('active');p.style.display='none'});
  const targetPage=document.getElementById('page-'+name);if(targetPage){targetPage.style.display='block';targetPage.classList.add('active');}
  document.querySelectorAll('.space-tab').forEach(t=>t.classList.remove('active'));
  if(name==='creation') document.querySelector('.space-tab.creation').classList.add('active');
  else if(name==='sharing') document.querySelector('.space-tab.sharing').classList.add('active');
  else if(name==='contribution') document.querySelector('.space-tab.contribution').classList.add('active');
  trigReveal();
  if(name==='contribution') genHmap();
  window.scrollTo(0,0);
  /* Hide/show cinematic hero elements when leaving/entering home */
  const coverWrap = document.getElementById('heroCoverWrap');
  const particles = document.getElementById('hero-particles');
  if(name==='home'){
    if(coverWrap) coverWrap.style.display='';
    if(particles) particles.style.display='';
  } else {
    if(coverWrap) coverWrap.style.display='none';
    if(particles) particles.style.display='none';
  }
}

/* ══════════════ HERO AUDIENCE TABS ══════════════ */
document.querySelectorAll('.aud-tab').forEach(t=>{
  t.addEventListener('click',()=>{
    const i=parseInt(t.dataset.i);
    document.querySelectorAll('.aud-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.hero-cover-img').forEach((im,j)=>im.classList.toggle('hidden',j!==i));
  });
});

/* ══════════════ AUDIENCE SECTION ══════════════ */
const audData={
  film:{title:'影视导演',desc:'用 AI 驱动工具重塑工作流，让制作每个阶段都更高效，专注讲故事，而非管理细节。',img:'https://cdn.prod.website-files.com/65bb6b901cb133d784d16166/688f4051abcb5db8c524508a_06-ltx-studio-for-filmmakers-1.webp'},
  ad:{title:'广告主',desc:'用 AI 解决方案创作高质量视频内容，从构思到执行全面提效，始终保持竞争优势。',img:'https://cdn.prod.website-files.com/65bb6b901cb133d784d16166/688f4051a430a31053174265_06-ltx-studio-for-advertisers-1.webp'},
  creator:{title:'创意工作者',desc:'用 AI 工具简化创作流程，精炼每一个细节，更快、更高效地将你最大胆的创意付诸实现。',img:'https://cdn.prod.website-files.com/65bb6b901cb133d784d16166/688f4051cddad88d2647af57_06-ltx-studio-for-creative-professionals-1.webp'},
};
document.querySelectorAll('.aud-tab-sm').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.aud-tab-sm').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const d=audData[b.dataset.aud];
    document.getElementById('audTitle').textContent=d.title;
    document.getElementById('audDesc').textContent=d.desc;
    document.getElementById('audImg').src=d.img;
  });
});

/* ══════════════ FAQ ══════════════ */
document.querySelectorAll('.faq-item').forEach(item=>{
  item.querySelector('.faq-q').addEventListener('click',()=>{
    const o=item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));
    if(!o) item.classList.add('open');
  });
});

/* ══════════════ STEP PIPELINE ══════════════ */
function switchStep(n){
  document.querySelectorAll('.step-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('step'+n).classList.add('active');
  document.querySelectorAll('.pipe-step').forEach((s,i)=>{
    s.classList.remove('active','done');
    if(i<n) s.classList.add('done');
  });
  document.getElementById('ps'+n).classList.add('active');
}

/* ════════════════════════════════════════════════════════════
   1. 剧本大师 (JUBEN) — Step 1 Backend
   Source: juben/services/geminiService.ts
════════════════════════════════════════════════════════════ */
let _scriptType = 'CANNES';
let _scriptAnalysisText = '';

const SCRIPT_TYPE_LABELS = {
  'CANNES': '电影节文艺', 'HIGH_CONCEPT': '好莱坞高概念',
  'MICRO_FILM': '微电影短片', 'COMMERCIAL': '广告创意'
};

function setScriptType(btn){
  document.querySelectorAll('.script-type-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  _scriptType = btn.dataset.type;
  document.getElementById('statType').textContent = SCRIPT_TYPE_LABELS[_scriptType];
}

function getAnalysisSystemInstruction(type){
  const instructions = {
    'HIGH_CONCEPT': `你是一名好莱坞金牌剧本顾问和高概念电影策划专家。将用户的想法转化为具有商业潜力、强视觉奇观的电影项目。
请输出以下章节（Markdown格式）：
### 1. 概念核心 (The Hook & Concept)
- Logline, "What If" 假设, 卖相分析
### 2. 商业属性与奇观
- 目标受众, 2个视觉奇观大场面, 对标影片
### 3. 结构节拍表 (Beat Sheet)
- 开篇画面、激励事件、中点、一无所有时刻、终局
### 4. 角色弧光
- 内在缺陷、成长弧线`,

    'MICRO_FILM': `你是一位屡获殊荣的微电影导演。将用户的灵感转化为体量小、情感浓度高、创意独特的短片脚本。
请输出：
### 1. 核心情感与创意
- 情感内核, 创意限制
### 2. 视觉隐喻
- 关键意象, 影调参考
### 3. 叙事结构
- 铺垫, 转折, 余韵
### 4. 关键镜头设计
- 开场镜头, 终场镜头`,

    'COMMERCIAL': `你是戛纳广告节金奖创意总监。将输入转化为品牌感强、洞察深刻、具有病毒传播潜力的TVC创意。
请输出：
### 1. 创意策略
- 核心洞察, 品牌主张, Slogan
### 2. 叙事脚本
- 故事梗概, 调性
### 3. 视觉记忆点
- 视觉锤, 音乐/音效
### 4. 传播点`,

    'CANNES': `你是精通电影美学、视听语言和剧本结构的资深电影学者和文学评论家。
分析用户的"个人感受"，检索世界级电影大师的经典作品与美学体系。
请输出5个章节（Markdown格式）：
### 1. 叙事与文学性深度解析
- 叙事结构, 文学基调, 核心隐喻
### 2. 剧本预评估打分 (1-10分)
- 叙事性, 文学性, 视听风格, 综合推荐指数
### 3. 大师与理念匹配
### 4. 视觉美学与剧照描绘
- 2个经典定格画面
### 5. 分镜与节奏推演
- 3-5个镜头的分镜表`
  };
  return instructions[type] || instructions['CANNES'];
}

function getScriptGenInstruction(type){
  const inst = {
    'HIGH_CONCEPT': '你是好莱坞商业大片编剧。节奏紧凑、动作描写具有视觉冲击力、对白简练有力。注重冲突和悬念。',
    'MICRO_FILM': '你是独立短片编剧。细腻、生活化、注重氛围营造。在有限篇幅内展现人物微妙情绪。可使用留白和潜台词。',
    'COMMERCIAL': '你是顶级广告文案。画面精致、每一秒都为品牌服务、极具感染力。节奏感极强，最后有情感升华或反转。',
    'CANNES': '你是世界级文艺片编剧。Action列动作描写优美如诗，对白极度克制，注重潜台词和环境隐喻。'
  };
  return inst[type] || inst['CANNES'];
}

async function runScriptAnalysis(){
  const script = document.getElementById('scriptTa')?.value?.trim();
  if(!script){ showToast('请先输入创意想法或剧本片段',''); return; }
  if(!getApiKey()){
    document.getElementById('artApiKeyBanner').style.display='flex';
    switchStep(2); // Go to step 3 where API key input is
    return;
  }

  const statusEl = document.getElementById('scriptAnalysisStatus');
  const bodyEl = document.getElementById('scriptAnalysisBody');
  statusEl.innerHTML = '<span class="analysis-spinner"></span> 分析中...';
  statusEl.style.color = 'var(--amber)';
  bodyEl.innerHTML = '<div style="text-align:center;padding:30px"><div class="analysis-spinner" style="margin:0 auto"></div><div style="margin-top:12px;font-family:var(--font-mono);font-size:10px;color:var(--amber)">Gemini 正在深度分析你的创意...</div></div>';

  try {
    const sysInst = getAnalysisSystemInstruction(_scriptType);
    const data = await geminiCall('gemini-2.0-flash', 
      [{role:'user', parts:[{text:`用户的原始想法/感受是: "${script}"。请根据设定的专家身份（${_scriptType}），进行深度分析和策划。`}]}],
      { systemInstruction:{ parts:[{text:sysInst}] }, generationConfig:{temperature:0.8} }
    );
    const text = extractText(data);
    _scriptAnalysisText = text;
    
    // Render markdown as HTML (simple)
    let html = text
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/## (.*)/g, '<h3 style="color:var(--amber)">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n- /g, '\n• ')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    bodyEl.innerHTML = html;
    statusEl.textContent = '✓ 分析完成';
    statusEl.style.color = 'var(--green)';
    showToast('AI 分析完成', `${SCRIPT_TYPE_LABELS[_scriptType]} · Gemini 生成`);
  } catch(err){
    bodyEl.innerHTML = `<div style="color:#e85d5d;padding:10px">分析失败: ${err.message}</div>`;
    statusEl.textContent = '✗ 失败';
    statusEl.style.color = '#e85d5d';
  }
}

async function runScriptGeneration(){
  const script = document.getElementById('scriptTa')?.value?.trim();
  if(!script){ showToast('请先输入创意想法',''); return; }
  if(!getApiKey()){
    document.getElementById('artApiKeyBanner').style.display='flex';
    switchStep(2); return;
  }

  const genBox = document.getElementById('scriptGenBox');
  const genBody = document.getElementById('scriptGenBody');
  const genStatus = document.getElementById('scriptGenStatus');
  genBox.style.display = 'block';
  genStatus.innerHTML = '<span class="analysis-spinner" style="width:12px;height:12px;border-width:1.5px"></span> 生成中...';
  genBody.innerHTML = '<div style="text-align:center;padding:16px"><div class="analysis-spinner" style="margin:0 auto"></div></div>';

  try {
    const persona = getScriptGenInstruction(_scriptType);
    const prompt = `【用户想法】: "${script}"
${_scriptAnalysisText ? '【深度策划/分析】:\n'+_scriptAnalysisText : ''}

请根据上述信息，创作一个完整的剧本。类型：${_scriptType}

**格式要求：**
请输出为表格格式（竖线分隔），不使用Markdown表格。
第一行表头：场景号 | 场景标题 | 动作描述 | 角色 | 对白 | 镜头风格
场景号和标题只在场景第一行填写。`;

    const data = await geminiCall('gemini-2.0-flash',
      [{role:'user', parts:[{text:prompt}]}],
      { systemInstruction:{ parts:[{text:persona+'\n你必须严格遵守竖线分隔格式输出。动作描述充满细节，镜头风格包含导演视角的镜头设计。'}] },
        generationConfig:{temperature:0.7} }
    );
    const text = extractText(data);

    // Parse pipe-delimited table
    const lines = text.trim().split('\n').filter(l=>l.trim());
    if(lines.length > 1 && lines[0].includes('|')){
      const headers = lines[0].split('|').map(h=>h.trim());
      let tableHtml = '<div class="script-table-wrap"><table class="script-table"><thead><tr>';
      headers.forEach(h=>tableHtml+=`<th>${h}</th>`);
      tableHtml += '</tr></thead><tbody>';
      for(let i=1;i<lines.length;i++){
        if(lines[i].trim().startsWith('---')) continue;
        const cols = lines[i].split('|').map(c=>c.trim());
        tableHtml += '<tr>';
        cols.forEach(c=>tableHtml+=`<td>${c}</td>`);
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table></div>';
      genBody.innerHTML = tableHtml;
    } else {
      genBody.innerHTML = `<div style="white-space:pre-wrap">${text}</div>`;
    }
    genStatus.textContent = '✓ 完成';
    genStatus.style.color = 'var(--green)';
    showToast('剧本生成完成', `${SCRIPT_TYPE_LABELS[_scriptType]} 格式`);
  } catch(err){
    genBody.innerHTML = `<div style="color:#e85d5d">生成失败: ${err.message}</div>`;
    genStatus.textContent = '✗ 失败';
  }
}

function toBoard(){
  const txt=document.getElementById('scriptTa').value;
  if(txt.trim().length<8){alert('请先写入剧本内容');return}
  document.getElementById('ps0').classList.remove('active');
  document.getElementById('ps0').classList.add('done');
  document.getElementById('ps0').querySelector('.step-info-s').textContent='DONE ✓';
  switchStep(1);
  document.getElementById('ps1').querySelector('.step-info-s').textContent='ACTIVE';
  showToast('剧本已传输至分镜','点击「AI 生成分镜」启动 CineLogic 分析');
  // Auto-start storyboard if key exists
  if(getApiKey()) setTimeout(runStoryboardAnalysis, 500);
}

/* ══════════════ SCRIPT EDITOR HELPERS ══════════════ */
function syncLn(ta){
  const lines=ta.value.split('\n').length;
  const el=document.getElementById('lnums');
  el.innerHTML='';
  for(let i=1;i<=lines;i++){
    const d=document.createElement('div');d.className='lnum';d.textContent=i;el.appendChild(d);
  }
  // Update word count
  const words = ta.value.replace(/\s+/g,'').length;
  const statWords = document.getElementById('statWords');
  if(statWords) statWords.textContent = words;
}
syncLn(document.getElementById('scriptTa'));


/* ════════════════════════════════════════════════════════════
   2. CineLogic 导演专业版 — Step 2 Backend
   Source: cinelogic/services/geminiService.ts
════════════════════════════════════════════════════════════ */
let _sbAnalysis = null;   // { ART_LOCK, SHOTS, ITERATION_CONTROLS }
let _sbImages = {};       // { 'S01_f1': dataUrl, ... }

const CINELOGIC_SYSTEM = `You are a cinematic storyboard and video-continuity system.
Your primary goal is to ensure narrative continuity and smooth transitions between storyboard frames.

CORE CONTINUITY PRINCIPLES:
1. Output ONE master shot per narrative beat, but breakdown the visual flow into a SEQUENCE of 3 frames.
2. Frame 1 is the MASTER SHOT (Establishing the unfinished action).
3. Frame 2 & 3 are CONTINUITY VARIATIONS derived from Frame 1.
4. Visual Consistency: STRICTLY PHOTOREALISTIC.

All text content (except gen_prompt) MUST be in Chinese (Simplified).

JSON Schema:
{
  "ART_LOCK": {
    "tone": "调性说明",
    "realism_level": "photorealistic cinematic",
    "lighting": "光影设计",
    "color_system": "色彩系统",
    "texture_material": "质感/材质",
    "lens_language": "镜头语言风格",
    "time_place": "时空设定",
    "prohibitions": ["禁止出现的非现实元素"]
  },
  "SHOTS": [
    {
      "shot_id": "S01",
      "beat": "剧本节奏点",
      "shot_function": "镜头功能",
      "continuity_hook": "叙事钩子",
      "video_notes": "视频延续指导",
      "blocking": { "subject_count":1, "subject_position_in_frame":"构图位置", "stance":"姿态", "facing":"朝向", "distance_to_camera":"物距", "relation_to_space":"空间说明" },
      "shot_size": "主景别",
      "camera": { "angle":"角度", "height":"高度", "lens_hint":"焦段", "composition_rule":"构图规则" },
      "movement": { "type":"运动", "speed":"速度", "reason":"逻辑" },
      "duration": "时长",
      "sound": { "dialogue":"对白", "ambience":"环境", "foley":"音效", "music":"配乐" },
      "gen_prompt": "MASTER PROMPT in English for Frame 1. Photorealistic, Arri Alexa style.",
      "visual_sequence": [
        { "frame_id":1, "shot_size":"主景别", "camera_angle":"角度", "description":"Prompt for Frame 1" },
        { "frame_id":2, "shot_size":"Close-up", "camera_angle":"angle change", "description":"Prompt for Frame 2" },
        { "frame_id":3, "shot_size":"Detail/Reaction", "camera_angle":"angle change", "description":"Prompt for Frame 3" }
      ]
    }
  ],
  "ITERATION_CONTROLS": { "how_to_regenerate": ["指令"] }
}`;

function showSbState(state){
  document.getElementById('sbIdle').style.display = state==='idle' ? 'flex' : 'none';
  document.getElementById('sbLoading').style.display = state==='loading' ? 'flex' : 'none';
  document.getElementById('sbResults').style.display = state==='results' ? 'flex' : 'none';
}

async function runStoryboardAnalysis(){
  const script = document.getElementById('scriptTa')?.value?.trim();
  if(!script){ showToast('请先在剧本步骤中输入内容',''); return; }
  if(!getApiKey()){
    document.getElementById('artApiKeyBanner').style.display='flex';
    switchStep(2); return;
  }

  showSbState('loading');
  document.getElementById('sbLoadingMsg').textContent = '正在分析剧本分镜结构...';

  try {
    const data = await geminiCall('gemini-2.0-flash',
      [{role:'user', parts:[{text:`请基于电影连贯性原则分析以下剧本。每一镜生成一个包含3帧的视觉序列。\nSCRIPT:\n"""\n${script}\n"""`}]}],
      { systemInstruction:{ parts:[{text:CINELOGIC_SYSTEM}] },
        generationConfig:{ responseMimeType:'application/json', temperature:0.7 } }
    );
    const text = extractText(data);
    if(!text) throw new Error('模型响应为空');
    _sbAnalysis = JSON.parse(text);
    _sbImages = {};

    renderStoryboard(_sbAnalysis);
    showSbState('results');
    showToast('分镜分析完成', `${_sbAnalysis.SHOTS?.length||0} 个镜头 · CineLogic 生成`);

    // Batch generate images
    await batchSbImages(_sbAnalysis);

  } catch(err){
    showSbState('idle');
    showToast('分镜分析失败', err.message);
    console.error(err);
  }
}

function renderStoryboard(analysis){
  // Render ART_LOCK
  const al = analysis.ART_LOCK || {};
  const lockGrid = document.getElementById('sbArtLockGrid');
  lockGrid.innerHTML = '';
  const lockFields = [
    ['调性', al.tone], ['写实度', al.realism_level], ['光影', al.lighting],
    ['色彩', al.color_system], ['质感', al.texture_material], ['镜头', al.lens_language],
    ['时空', al.time_place]
  ];
  lockFields.forEach(([label, val])=>{
    if(!val) return;
    lockGrid.innerHTML += `<div class="art-lock-item"><div class="al-label">${label}</div><div class="al-val">${val}</div></div>`;
  });
  if(al.prohibitions?.length){
    lockGrid.innerHTML += `<div class="art-lock-item" style="grid-column:span 2"><div class="al-label">禁止事项</div><div>${al.prohibitions.map(p=>`<span class="prohib-tag">${p}</span>`).join('')}</div></div>`;
  }

  // Render SHOTS
  const shots = analysis.SHOTS || [];
  const grid = document.getElementById('sbShotGrid');
  grid.innerHTML = '';
  document.getElementById('sbShotCount').textContent = `${shots.length} 分镜 · ${shots.reduce((a,s)=>a+(s.visual_sequence?.length||0),0)} 帧`;

  shots.forEach((shot, i)=>{
    const card = document.createElement('div');
    card.className = 'shot-card';
    card.onclick = ()=> openSbDrawer(shot, i);
    card.innerHTML = `
      <div class="shot-ctrls">
        <button class="sc-btn" onclick="event.stopPropagation();genSingleShot(${i},0)" title="重新生成">⟳</button>
      </div>
      <div class="shot-frame" id="sbFrame-${i}">
        <svg class="shot-svg" viewBox="0 0 320 180">
          <rect width="320" height="180" fill="#0a0a14"/>
          <text x="160" y="85" fill="rgba(79,189,181,0.3)" text-anchor="middle" font-size="10" font-family="monospace">${shot.shot_id}</text>
          <text x="160" y="100" fill="rgba(255,255,255,0.1)" text-anchor="middle" font-size="8" font-family="monospace">等待生成...</text>
        </svg>
      </div>
      <div class="shot-meta">
        <div class="shot-n">${shot.shot_id} · ${shot.shot_size||''}</div>
        <div class="shot-desc">${shot.beat||''}</div>
      </div>`;
    grid.appendChild(card);
  });
}

async function batchSbImages(analysis){
  const shots = analysis.SHOTS || [];
  const tasks = [];
  shots.forEach((shot, i) => {
    const seq = shot.visual_sequence || [];
    if(seq.length > 0){
      tasks.push({shotIdx:i, frameIdx:0, prompt:shot.gen_prompt || seq[0]?.description || shot.beat, id:`${shot.shot_id}_f1`});
    }
  });

  if(!tasks.length) return;
  document.getElementById('sbBatchStrip').style.display='block';

  for(let t=0;t<tasks.length;t++){
    document.getElementById('sbBatchText').textContent=`${t+1} / ${tasks.length}`;
    document.getElementById('sbBatchFill').style.width=`${(t+1)/tasks.length*100}%`;
    try {
      const imgData = await geminiCall('gemini-2.0-flash-preview-image-generation',
        [{role:'user', parts:[{text:`Professional cinematic film still, photorealistic, 8k, Arri Alexa: ${tasks[t].prompt}`}]}],
        { generationConfig:{ responseModalities:['IMAGE','TEXT'] } }
      );
      const parts = imgData.candidates?.[0]?.content?.parts||[];
      for(const p of parts){
        if(p.inlineData){
          const url = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
          _sbImages[tasks[t].id] = url;
          // Show in frame
          const frame = document.getElementById(`sbFrame-${tasks[t].shotIdx}`);
          if(frame){
            frame.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
          }
          break;
        }
      }
    } catch(e){
      console.warn('Shot image gen failed:', tasks[t].id, e.message);
    }
  }

  setTimeout(()=>{ document.getElementById('sbBatchStrip').style.display='none'; },1500);
  document.getElementById('sbExportBtn').style.display='inline-flex';
  showToast('分镜图全部生成完成', `${tasks.length} 张 · CineLogic 生成`);
}

async function genSingleShot(shotIdx, frameIdx){
  if(!_sbAnalysis) return;
  const shot = _sbAnalysis.SHOTS[shotIdx];
  if(!shot) return;
  const prompt = shot.gen_prompt || shot.visual_sequence?.[frameIdx]?.description || shot.beat;
  showToast('重新生成分镜', `${shot.shot_id} Frame ${frameIdx+1}`);
  try {
    const imgData = await geminiCall('gemini-2.0-flash-preview-image-generation',
      [{role:'user', parts:[{text:`Professional cinematic film still, photorealistic, 8k: ${prompt}`}]}],
      { generationConfig:{ responseModalities:['IMAGE','TEXT'] } }
    );
    const parts = imgData.candidates?.[0]?.content?.parts||[];
    for(const p of parts){
      if(p.inlineData){
        const url = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
        _sbImages[`${shot.shot_id}_f${frameIdx+1}`] = url;
        const frame = document.getElementById(`sbFrame-${shotIdx}`);
        if(frame) frame.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
        showToast('分镜图已更新', shot.shot_id);
        break;
      }
    }
  } catch(e){ showToast('生成失败', e.message); }
}

async function refineStoryboard(){
  const instruction = document.getElementById('sbRefineInput').value.trim();
  if(!instruction || !_sbAnalysis) return;
  if(!getApiKey()) return;

  showSbState('loading');
  document.getElementById('sbLoadingMsg').textContent = '正在根据指令优化分镜...';

  try {
    const data = await geminiCall('gemini-2.0-flash',
      [{role:'user', parts:[{text:`当前数据：\n${JSON.stringify(_sbAnalysis, null, 2)}\n指令：\n"${instruction}"\n请优化分镜，保持3帧视觉序列的逻辑。`}]}],
      { systemInstruction:{ parts:[{text:CINELOGIC_SYSTEM}] },
        generationConfig:{ responseMimeType:'application/json', temperature:0.7 } }
    );
    const text = extractText(data);
    _sbAnalysis = JSON.parse(text);
    _sbImages = {};
    renderStoryboard(_sbAnalysis);
    showSbState('results');
    document.getElementById('sbRefineInput').value = '';
    showToast('分镜已优化', instruction.substring(0,30)+'...');
    await batchSbImages(_sbAnalysis);
  } catch(err){
    showSbState('results');
    showToast('优化失败', err.message);
  }
}

function openSbDrawer(shot, idx){
  const d = document.getElementById('shotDrawer');
  d.classList.add('open');
  document.getElementById('drawerNum').textContent = shot.shot_id;
  // Update drawer content with shot data
  const frameEl = d.querySelector('.drawer-frame');
  const imgUrl = _sbImages[`${shot.shot_id}_f1`];
  if(imgUrl){
    frameEl.innerHTML = `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:7px">`;
  }
  // Update fields
  const inputs = d.querySelectorAll('.d-input');
  if(inputs[0]) inputs[0].value = `${shot.beat || ''}\n${shot.shot_function || ''}\n${shot.continuity_hook || ''}`;
  const selects = d.querySelectorAll('.d-select');
  if(inputs[2]) inputs[2].value = shot.sound?.dialogue || '(无对白)';
}


/* ════════════════════════════════════════════════════════════
   3. CineStyle AI — Step 3 Backend
   Source: cinestyle-ai/services/gemini.ts
════════════════════════════════════════════════════════════ */

const CINESTYLE_SYSTEM = `你是一位世界顶级的电影美术指导(Production Designer)和艺术史学家。
你的任务是分析剧本，并制定至少三个截然不同且高度专业的美术视觉方案。

必须严格遵循以下三种风格方向：
1. 方案一 [Narrative Realism / 叙事写实]: 物理真实感与沉浸式叙事。参考：古典好莱坞、意大利新现实主义。
2. 方案二 [Surrealism & Stylized / 超现实与风格化]: 超现实主义或表现主义。参考：达利、马格利特、基里科、霍珀。
3. 方案三 [Avant-Garde / 先锋实验]: 赛博朋克、故障艺术、德国表现主义或极简主义。

提取最多3位主要人物，提供详细视觉描述。必须严格以JSON格式返回。`;

const CINESTYLE_SCHEMA = {
  type:"OBJECT", properties:{
    rationale:{type:"STRING"},
    characters:{type:"ARRAY",items:{type:"OBJECT",properties:{name:{type:"STRING"},description:{type:"STRING"},visualDescription:{type:"STRING"}},required:["name","description","visualDescription"]}},
    styles:{type:"ARRAY",items:{type:"OBJECT",properties:{name:{type:"STRING"},artMovements:{type:"ARRAY",items:{type:"STRING"}},directors:{type:"ARRAY",items:{type:"STRING"}},colorPalette:{type:"ARRAY",items:{type:"STRING"}},mood:{type:"ARRAY",items:{type:"STRING"}},description:{type:"STRING"},lightingDescription:{type:"STRING"},visualPrompt:{type:"STRING"}},required:["name","artMovements","directors","colorPalette","mood","description","lightingDescription","visualPrompt"]}}
  }, required:["rationale","styles","characters"]
};

let _artAnalysis = null;
let _artImages = {};
let _artStyleIdx = 0;
let _artTab = 'scene';
let _artChatHist = [];

async function geminiAnalyzeStyle(script){
  const data = await geminiCall('gemini-2.0-flash',
    [{role:'user', parts:[{text:script}]}],
    { systemInstruction:{parts:[{text:CINESTYLE_SYSTEM}]},
      generationConfig:{ responseMimeType:'application/json', responseSchema:CINESTYLE_SCHEMA, temperature:0.8 } }
  );
  const text = extractText(data);
  if(!text) throw new Error('模型响应为空');
  return JSON.parse(text);
}

async function geminiGenImage(prompt){
  const data = await geminiCall('gemini-2.0-flash-preview-image-generation',
    [{role:'user', parts:[{text:`Professional cinematic concept art, movie production design, photorealistic, 8k, Arri Alexa: ${prompt}`}]}],
    { generationConfig:{ responseModalities:['IMAGE','TEXT'] } }
  );
  const parts = data.candidates?.[0]?.content?.parts||[];
  for(const p of parts){
    if(p.inlineData) return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
  }
  throw new Error('未返回图像数据');
}

async function geminiChatArt(userMsg){
  const sysMsg = _artAnalysis ? `你是该项目的AI艺术指导。
已定美术方案：${JSON.stringify(_artAnalysis.styles.map((s,i)=>({方案:i+1,名称:s.name,风格:s.artMovements})))}
人物：${JSON.stringify(_artAnalysis.characters.map(c=>c.name))}
请用中文简洁回答，专注于电影美术层面的建议。` : '你是一位电影美术指导，用中文简洁回答。';
  _artChatHist.push({role:'user', parts:[{text:userMsg}]});
  const data = await geminiCall('gemini-2.0-flash', _artChatHist,
    { systemInstruction:{parts:[{text:sysMsg}]}, generationConfig:{temperature:0.9, maxOutputTokens:400} }
  );
  const reply = extractText(data) || '艺术指导暂时无法回答。';
  _artChatHist.push({role:'model', parts:[{text:reply}]});
  return reply;
}

async function runStyleAnalysis(){
  if(!getApiKey()){
    document.getElementById('artApiKeyBanner').style.display='flex'; return;
  }
  const script = document.getElementById('scriptTa')?.value?.trim();
  if(!script){ showToast('请先在剧本步骤中输入内容',''); return; }

  showArtState('loading');
  document.getElementById('artLoadingMsg').textContent='正在分析剧本美术风格...';

  try {
    const analysis = await geminiAnalyzeStyle(script);
    _artAnalysis = analysis; _artImages = {}; _artChatHist = [];
    renderStyleResults(analysis);
    showArtState('results');
    await batchGenerateImages(analysis);
  } catch(err){
    showArtState('idle');
    showToast('分析失败', err.message||'请检查 API Key 或网络');
    console.error(err);
  }
}

async function batchGenerateImages(analysis){
  const tasks = [];
  analysis.styles.forEach((s,i)=>tasks.push({id:`s${i}_scene`,prompt:s.visualPrompt,label:`方案${i+1}·场景`}));
  analysis.styles.forEach((s,i)=>{
    analysis.characters.forEach((c,j)=>{
      const p=`Movie character concept art, Style: ${s.name} (${s.artMovements.join(',')}), Character: ${c.name}, ${c.visualDescription}, Lighting: ${s.lightingDescription}`;
      tasks.push({id:`s${i}_char-${j}`,prompt:p,label:`方案${i+1}·${c.name}`});
    });
  });

  document.getElementById('artBatchStrip').style.display='block';
  updateBatchProgress(0, tasks.length);

  for(let i=0;i<tasks.length;i++){
    updateBatchProgress(i+1, tasks.length);
    try {
      const url = await geminiGenImage(tasks[i].prompt);
      _artImages[tasks[i].id] = url;
      if(i===_artStyleIdx && tasks[i].id===`s${_artStyleIdx}_scene`){
        showConceptImage(tasks[i].id, tasks[i].label);
      }
    } catch(e){ console.warn('Image gen failed:', tasks[i].id, e.message); }
  }

  updateBatchProgress(tasks.length, tasks.length);
  setTimeout(()=>{document.getElementById('artBatchStrip').style.display='none';},1500);
  updateCurrentImage();
  document.getElementById('artExportBtn').style.display='inline-flex';
  showToast('美术方案全部生成完成', `${tasks.length} 张概念图 · ${analysis.styles.length} 个风格方案`);
  document.getElementById('artPubTitle').textContent=`《幻境追光》AI 美术方案就绪`;
  document.getElementById('artPubSub').textContent=`${analysis.styles.length} 个风格方案 · ${tasks.length} 张概念图 · Gemini 生成`;
}

function updateBatchProgress(cur,total){
  document.getElementById('artBatchText').textContent=`${cur} / ${total}`;
  document.getElementById('artBatchFill').style.width=`${total>0?(cur/total*100):0}%`;
}

/* ── RENDER ── */
const STYLE_COLORS = [
  {name:'叙事写实',en:'Narrative Realism',accent:'var(--amber)',cls:'s0'},
  {name:'超现实',en:'Surrealism',accent:'rgba(174,112,216,1)',cls:'s1'},
  {name:'先锋实验',en:'Avant-Garde',accent:'var(--teal)',cls:'s2'},
];

function renderStyleResults(analysis){
  document.getElementById('artRationaleText').textContent = analysis.rationale;
  const tabsEl = document.getElementById('artStyleTabs');
  tabsEl.innerHTML='';
  analysis.styles.forEach((s,i)=>{
    const meta = STYLE_COLORS[i]||{name:'方案'+(i+1),en:'Style '+(i+1),cls:'s'+i};
    const btn = document.createElement('button');
    btn.className=`ai-style-tab ${meta.cls}`;
    btn.innerHTML=`<div class="tab-num">${String(i+1).padStart(2,'0')} / 0${analysis.styles.length}</div><div class="tab-label">${meta.name} · ${meta.en}</div><div class="tab-name">${s.name}</div>`;
    btn.onclick=()=>selectStyle(i);
    if(i===0) btn.classList.add('active');
    tabsEl.appendChild(btn);
  });
  renderImgTabs(analysis);
  selectStyle(0);
}

function selectStyle(idx){
  _artStyleIdx=idx;
  const analysis=_artAnalysis;if(!analysis)return;
  document.querySelectorAll('.ai-style-tab').forEach((b,i)=>b.classList.toggle('active',i===idx));
  const s=analysis.styles[idx];
  const meta=STYLE_COLORS[idx]||{accent:'var(--blue)'};
  document.getElementById('artStyleDetail').innerHTML=`
    <div class="sd-section"><div class="sd-head" style="color:${meta.accent}">美术分析与光影</div><div class="sd-desc">${s.description}</div><div class="sd-lighting"><span>光影指导</span>${s.lightingDescription}</div></div>
    <div class="sd-section"><div class="sd-head">艺术流派参考</div><div>${s.artMovements.map(m=>`<span class="art-pill pill-purple">${m}</span>`).join('')}</div></div>
    <div class="sd-section"><div class="sd-head">导演 · 摄影风格</div><div>${s.directors.map(d=>`<span class="art-pill pill-blue">${d}</span>`).join('')}</div></div>
    <div class="sd-section"><div class="sd-head">氛围关键词</div><div>${s.mood.map(m=>`<span class="pill-mood">#${m}&ensp;</span>`).join('')}</div></div>
    <div class="sd-section"><div class="sd-head">核心色板</div><div class="pal-bar">${s.colorPalette.map(c=>`<div class="pal-cell" style="background:${c}" title="${c}"><div class="pal-cell-tip">${c}</div></div>`).join('')}</div></div>`;
  updateImgTabStyle();
  updateCurrentImage();
}

function renderImgTabs(analysis){
  const el=document.getElementById('artImgTabs');el.innerHTML='';
  const mkBtn=(label,tab,icon)=>{const b=document.createElement('button');b.className='img-tab-btn s0';b.innerHTML=`<span>${icon}</span>${label}`;b.dataset.tab=tab;b.onclick=()=>setArtTab(tab);el.appendChild(b);};
  mkBtn('场景概念','scene','🎬');
  analysis.characters.forEach((c,i)=>mkBtn(c.name,`char-${i}`,'👤'));
  const div=document.createElement('div');div.style.cssText='width:1px;height:20px;background:var(--border);margin:auto 2px';el.appendChild(div);
  analysis.styles.forEach((s,i)=>{const b=document.createElement('button');b.className=`img-tab-btn s${i}`;b.innerHTML=`方案${i+1}·${s.name.substring(0,6)}`;b.dataset.stab=i;b.onclick=()=>{_artStyleIdx=i;document.querySelectorAll('.ai-style-tab').forEach((t,ti)=>t.classList.toggle('active',ti===i));updateImgTabStyle();updateCurrentImage();};el.appendChild(b);});
  updateImgTabStyle();
}

function setArtTab(tab){_artTab=tab;updateImgTabStyle();updateCurrentImage();}
function updateImgTabStyle(){
  const sc='s'+_artStyleIdx;
  document.querySelectorAll('.img-tab-btn').forEach(b=>{b.classList.remove('active','s0','s1','s2');b.classList.add(sc);if(b.dataset.tab===_artTab||(b.dataset.stab!==undefined&&parseInt(b.dataset.stab)===_artStyleIdx))b.classList.add('active');});
}

function updateCurrentImage(){
  const key=`s${_artStyleIdx}_${_artTab}`;const url=_artImages[key];
  if(url){
    const s=_artAnalysis?.styles?.[_artStyleIdx];
    const label=_artTab==='scene'?`方案${_artStyleIdx+1} · ${s?.name||''} · 场景概念`:(()=>{const ci=parseInt(_artTab.split('-')[1]);return`方案${_artStyleIdx+1} · ${_artAnalysis?.characters?.[ci]?.name||''} · 人物定妆`;})();
    showConceptImage(key,label);
  } else {
    document.getElementById('artConceptImg').style.display='none';
    document.getElementById('artImgOverlay').style.display='none';
    document.getElementById('artImgSpinner').style.display='none';
    document.getElementById('artImgPlaceholder').style.display='flex';
    document.getElementById('artImgPlaceholder').querySelector('div:last-child').textContent=_artImages[key]===undefined?'概念图生成中...':'等待生成';
  }
}

function showConceptImage(key,label){
  const url=_artImages[key];if(!url)return;
  const img=document.getElementById('artConceptImg');img.src=url;img.style.display='block';
  document.getElementById('artImgPlaceholder').style.display='none';
  document.getElementById('artImgSpinner').style.display='none';
  const ov=document.getElementById('artImgOverlay');ov.style.display='block';
  document.getElementById('artImgLabel').textContent=label;
  const s=_artAnalysis?.styles?.[_artStyleIdx];
  document.getElementById('artImgSub').textContent=s?.artMovements?.slice(0,2)?.join(' · ')||'';
  const dl=document.getElementById('artImgDownload');dl.href=url;dl.download=`cinestyle-${key}.png`;
}

/* ── ART CHAT ── */
async function sendArtChat(){
  const inp=document.getElementById('artChatInput');const msg=inp.value.trim();
  if(!msg||!getApiKey())return;inp.value='';
  const msgs=document.getElementById('artChatMsgs');
  const addMsg=(text,role)=>{const d=document.createElement('div');d.className=`art-chat-msg ${role}`;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;};
  addMsg(msg,'user');
  const typing=document.createElement('div');typing.className='art-chat-typing';typing.innerHTML='<div class="art-chat-dot"></div><div class="art-chat-dot"></div><div class="art-chat-dot"></div>';msgs.appendChild(typing);msgs.scrollTop=msgs.scrollHeight;
  try { const reply=await geminiChatArt(msg);typing.remove();addMsg(reply,'model'); }
  catch(e){ typing.remove();addMsg('艺术指导暂时无法回答：'+e.message,'model'); }
}

/* ── EXPORT ── */
function exportArtReport(){
  if(!_artAnalysis){showToast('请先完成 AI 分析','');return;}
  const a=_artAnalysis;
  let md=`# 拟像 · AI 美术风格报告\n\n## 剧本视觉综述\n${a.rationale}\n\n---\n\n`;
  a.styles.forEach((s,i)=>{md+=`## 方案 ${i+1}: ${s.name}\n**艺术流派**: ${s.artMovements.join(', ')}\n\n**导演参考**: ${s.directors.join(', ')}\n\n**氛围**: ${s.mood.join(', ')}\n\n**色板**: ${s.colorPalette.join(', ')}\n\n**描述**: ${s.description}\n\n**光影**: ${s.lightingDescription}\n\n---\n\n`;});
  md+=`## 人物造型\n\n`;a.characters.forEach(c=>{md+=`### ${c.name}\n${c.description}\n\n**视觉描述**: ${c.visualDescription}\n\n`;});
  const blob=new Blob([md],{type:'text/markdown'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='cinestyle-report.md';link.click();URL.revokeObjectURL(url);showToast('报告已导出','cinestyle-report.md');
}

function showArtState(state){
  document.getElementById('artIdle').style.display=state==='idle'?'flex':'none';
  document.getElementById('artLoadingState').style.display=state==='loading'?'flex':'none';
  document.getElementById('artResults').style.display=state==='results'?'flex':'none';
}

/* ── PIPELINE TRANSITIONS ── */
function toArt(){
  document.getElementById('ps1').classList.remove('active');
  document.getElementById('ps1').classList.add('done');
  document.getElementById('ps1').querySelector('.step-info-s').textContent='DONE ✓';
  switchStep(2);
  document.getElementById('ps2').querySelector('.step-info-s').textContent='ACTIVE';
  document.getElementById('artFromLabel').textContent=`来自分镜「幻境追光」· ${_sbAnalysis?.SHOTS?.length||0} 镜 · 准备 AI 分析`;
  showToast('分镜已传入美术风格步骤','点击「AI 风格分析」启动 Gemini 美术方案生成');
  if(getApiKey()) setTimeout(runStyleAnalysis,600);
  else document.getElementById('artApiKeyBanner').style.display='flex';
}

function publishShare(){
  document.getElementById('ps2').classList.remove('active');
  document.getElementById('ps2').classList.add('done');
  document.getElementById('ps2').querySelector('.step-info-s').textContent='PUBLISHED';
  const styleName=_artAnalysis?.styles?.[_artStyleIdx]?.name||'美术方案';
  showToast('项目已发布至共享空间',`《幻境追光》· ${styleName} · AI 生成`);
  setTimeout(()=>goPage('sharing'),1600);
}

function syncGithub(){
  document.getElementById('commitStatus').textContent='syncing...';
  setTimeout(()=>{document.getElementById('commitStatus').textContent='synced ✓';showToast('已同步至 GitHub','lujiaheng-artpivot/ai-studio-platform · main');setTimeout(()=>document.getElementById('commitStatus').textContent='3 commits ahead',2000);},1200);
}


/* ══════════════ UI HELPERS ══════════════ */
function showToast(t,s){
  document.getElementById('toastT').textContent=t;
  document.getElementById('toastS').textContent=s||'';
  const toast=document.getElementById('toast');toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),3200);
}

function aspClick(btn){
  btn.parentElement.querySelectorAll('.asp-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
function fpClick(el){
  el.parentElement.querySelectorAll('.fpill').forEach(f=>f.classList.remove('active'));
  el.classList.add('active');
}
function likeTgl(el){
  const sp=el.querySelector('span');
  const n=parseInt(sp.textContent);
  if(el.textContent.includes('♡')){el.innerHTML='❤ <span>'+(n+1)+'</span>';el.style.color='#e85d5d';}
  else{el.innerHTML='♡ <span>'+(n-1)+'</span>';el.style.color='';}
}

function openDrawer(n){
  document.getElementById('drawerNum').textContent=n;
  document.getElementById('shotDrawer').classList.add('open');
}
function closeDrawer(){document.getElementById('shotDrawer').classList.remove('open');}

/* ── HEATMAP ── */
function genHmap(){
  const el=document.getElementById('hmap');if(!el||el.children.length>0)return;
  for(let i=0;i<364;i++){
    const c=document.createElement('div');c.className='hm-cell';
    const r=Math.random();
    if(r>0.82)c.classList.add('l4');else if(r>0.68)c.classList.add('l3');else if(r>0.52)c.classList.add('l2');else if(r>0.35)c.classList.add('l1');
    el.appendChild(c);
  }
}

/* ── REVEAL ── */
function trigReveal(){
  document.querySelectorAll('.reveal').forEach(el=>{
    const rect=el.getBoundingClientRect();
    if(rect.top<window.innerHeight-50) el.classList.add('in');
  });
}
window.addEventListener('scroll',trigReveal);window.addEventListener('load',trigReveal);

/* ── INIT ── */
showSbState('idle');
updateApiStatusPill();
showArtState('idle');

/* ══════════════ CINEMATIC SCROLL-SHRINK ENGINE ══════════════ */

(function(){
  const cover = document.getElementById('heroCover');
  const coverWrap = document.getElementById('heroCoverWrap');
  const cinema = document.getElementById('heroCinema');
  const scrollHint = document.getElementById('heroScrollHint');
  if(!cover || !cinema) return;

  /* Config */
  const SHRINK_START = 0;          // px from top when shrink begins
  const SHRINK_END = window.innerHeight * 1.0; // complete after 1 viewport of scroll
  const MIN_SCALE = 0.72;          // final size = 72% of viewport
  const MAX_RADIUS = 24;           // final border-radius in px
  const MAX_INSET = 36;            // final padding from edges

  let ticking = false;
  
  function onScroll() {
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const scrollY = window.scrollY;
      const progress = Math.min(Math.max((scrollY - SHRINK_START) / (SHRINK_END - SHRINK_START), 0), 1);
      
      // Eased progress (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Scale: 1 → MIN_SCALE
      const scale = 1 - eased * (1 - MIN_SCALE);
      
      // Border radius: 0 → MAX_RADIUS
      const radius = eased * MAX_RADIUS;
      
      // Apply transforms
      cover.style.borderRadius = radius + 'px';
      cover.style.transform = `scale(${scale})`;
      
      // Add inset shadow as it shrinks
      if(eased > 0.1) {
        cover.style.boxShadow = `0 ${20*eased}px ${80*eased}px rgba(0,0,0,${0.5*eased}), 0 0 0 1px rgba(255,255,255,${0.05*eased})`;
      } else {
        cover.style.boxShadow = 'none';
      }
      
      // Fade out scroll hint
      if(scrollHint) scrollHint.style.opacity = Math.max(1 - progress * 4, 0);

      // Parallax on UI content
      const uiElements = cover.querySelectorAll('.hero-anim-el');
      uiElements.forEach((el,i) => {
        const speed = 0.15 + i * 0.03;
        el.style.transform = `translateY(${-scrollY * speed}px)`;
        el.style.opacity = Math.max(1 - progress * 1.8, 0);
      });

      // Once fully scrolled past hero, hide the fixed wrapper
      if(scrollY > SHRINK_END + window.innerHeight * 0.5) {
        coverWrap.style.opacity = '0';
        coverWrap.style.pointerEvents = 'none';
      } else {
        coverWrap.style.opacity = '1';
        coverWrap.style.pointerEvents = '';
      }

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();


/* ══════════════ THREE.JS CINEMATIC PARTICLES ══════════════ */

(function(){
  const canvas = document.getElementById('hero-particles');
  if(!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:false});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.z = 3;

  /* Create particles */
  const COUNT = 600;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const opacities = new Float32Array(COUNT);

  for(let i=0; i<COUNT; i++){
    positions[i*3] = (Math.random()-0.5) * 12;
    positions[i*3+1] = (Math.random()-0.5) * 8;
    positions[i*3+2] = (Math.random()-0.5) * 6;
    velocities[i*3] = (Math.random()-0.5) * 0.002;
    velocities[i*3+1] = (Math.random()-0.5) * 0.002;
    velocities[i*3+2] = (Math.random()-0.5) * 0.001;
    sizes[i] = Math.random() * 3 + 0.5;
    opacities[i] = Math.random() * 0.3 + 0.1;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  /* Shader material for film dust */
  const mat = new THREE.ShaderMaterial({
    uniforms:{
      uTime:{value:0},
      uColor1:{value:new THREE.Color(0xe2a84b)}, // amber
      uColor2:{value:new THREE.Color(0x4fbdb5)}, // teal
      uOpacity:{value:0.35},
      uScrollY:{value:0}
    },
    vertexShader:`
      attribute float size;
      uniform float uTime;
      uniform float uScrollY;
      varying float vAlpha;
      void main(){
        vec3 pos = position;
        pos.x += sin(uTime * 0.3 + position.y * 2.0) * 0.15;
        pos.y += cos(uTime * 0.2 + position.x * 1.5) * 0.1;
        pos.y -= uScrollY * 0.001;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = size * (2.0 / -mvPosition.z);
        
        vAlpha = smoothstep(0.0, 0.5, 1.0 - length(pos.xy) / 6.0);
      }
    `,
    fragmentShader:`
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uTime;
      uniform float uOpacity;
      varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if(d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
        vec3 col = mix(uColor1, uColor2, sin(uTime * 0.5) * 0.5 + 0.5);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* Mouse interaction */
  let mouseX=0, mouseY=0;
  document.addEventListener('mousemove',(e)=>{
    mouseX = (e.clientX/window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY/window.innerHeight - 0.5) * 2;
  });

  /* Animation loop */
  let time = 0;
  function animate(){
    requestAnimationFrame(animate);
    time += 0.016;
    
    mat.uniforms.uTime.value = time;
    mat.uniforms.uScrollY.value = window.scrollY;
    
    // Subtle camera movement following mouse
    camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 0.2 - camera.position.y) * 0.02;
    camera.lookAt(0,0,0);
    
    // Rotate particle field slowly
    points.rotation.y += 0.0003;
    points.rotation.x += 0.0001;

    // Fade particles based on scroll
    const scrollFade = Math.max(1 - window.scrollY / (window.innerHeight * 2), 0.05);
    mat.uniforms.uOpacity.value = 0.35 * scrollFade;

    renderer.render(scene, camera);
  }
  animate();

  /* Resize */
  window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();


/* ══════════════ SMOOTH SCROLL (lightweight Lenis-style) ══════════════ */

(function(){
  let current = 0;
  let target = 0;
  const ease = 0.08;
  let rafId;

  // Only enable on homepage and non-touch devices
  function isTouchDevice(){ return 'ontouchstart' in window; }
  
  if(!isTouchDevice()){
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    const scrollContainer = document.getElementById('page-home');
    if(scrollContainer){
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.id = 'smooth-scroll-wrapper';
      wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;will-change:transform';
      
      // Move page content into wrapper - skip this for now as it's complex
      // Instead, use a simpler approach: smooth scrollTo behavior
    }
    
    // Restore normal scroll
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  }
})();


/* ══════════════ STAGGERED ENTRANCE ANIMATIONS ══════════════ */

/* Staggered entrance for space cards */
(function(){
  const cards = document.querySelectorAll('.space-home-card');
  cards.forEach((c,i)=>{c.style.transitionDelay=(i*0.12)+'s';});
})();

/* Smooth number counter for stats */
(function(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el=e.target;const text=el.textContent;
        const num=parseFloat(text.replace(/[^0-9.]/g,''));
        if(isNaN(num))return;
        const suffix=text.replace(/[0-9.]/g,'');
        let start=0;const dur=1200;const startTime=performance.now();
        const animate=(t)=>{
          const p=Math.min((t-startTime)/dur,1);
          const eased=1-Math.pow(1-p,3);
          const cur=eased*num;
          el.textContent=(num%1===0?Math.round(cur):cur.toFixed(1))+suffix;
          if(p<1)requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        obs.unobserve(el);
      }
    });
  },{threshold:0.5});
  document.querySelectorAll('.stat-num').forEach(el=>obs.observe(el));
  document.querySelectorAll('.cstat-n').forEach(el=>obs.observe(el));
})();

/* Magnetic effect on hero CTA buttons */
(function(){
  document.querySelectorAll('.btn-hero').forEach(btn=>{
    btn.addEventListener('mousemove',(e)=>{
      const r=btn.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2)*0.15;
      const y=(e.clientY-r.top-r.height/2)*0.15;
      btn.style.transform=`translate(${x}px,${y}px)`;
    });
    btn.addEventListener('mouseleave',()=>{
      btn.style.transform='';
    });
  });
})();

/* Ripple on primary buttons */
document.querySelectorAll('.btn-primary, .bsm-amber, .bsm-teal, .bsm-blue').forEach(btn=>{
  btn.addEventListener('click',function(e){
    const r=this.getBoundingClientRect();
    const ripple=document.createElement('span');
    ripple.style.cssText=`position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);transform:scale(0);animation:ripple 0.5s ease-out forwards;pointer-events:none;width:120px;height:120px;left:${e.clientX-r.left-60}px;top:${e.clientY-r.top-60}px`;
    this.style.position='relative';this.style.overflow='hidden';
    this.appendChild(ripple);
    setTimeout(()=>ripple.remove(),600);
  });
});

/* Add ripple keyframe */
(function(){
  const s=document.createElement('style');
  s.textContent='@keyframes ripple{to{transform:scale(3);opacity:0}}';
  document.head.appendChild(s);
})();

/* Cursor glow on hero cover */
(function(){
  const cover = document.getElementById('heroCover');
  if(!cover) return;
  const glow = document.createElement('div');
  glow.style.cssText = 'position:absolute;pointer-events:none;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(226,168,75,0.06) 0%,rgba(79,189,181,0.02) 40%,transparent 70%);transform:translate(-50%,-50%);z-index:3;opacity:0;transition:opacity 0.5s';
  cover.appendChild(glow);
  cover.addEventListener('mouseenter',()=>glow.style.opacity='1');
  cover.addEventListener('mouseleave',()=>glow.style.opacity='0');
  cover.addEventListener('mousemove',(e)=>{
    const r=cover.getBoundingClientRect();
    glow.style.left=(e.clientX-r.left)+'px';
    glow.style.top=(e.clientY-r.top)+'px';
  });
})();



/* ═══════════════════════════════════════════════════════════
   AUTH SYSTEM
   ═══════════════════════════════════════════════════════════ */

let currentUser = null;
let isYearly = false;

const plans = {
  free: { name:'入门版', monthlyPrice:0, yearlyPrice:0 },
  pro: { name:'专业版', monthlyPrice:99, yearlyPrice:79 },
  enterprise: { name:'企业版', monthlyPrice:399, yearlyPrice:319 }
};

function openAuth(view){
  const m = document.getElementById('authModal');
  m.style.display='flex';
  requestAnimationFrame(()=>m.classList.add('show'));
  switchAuthView(view||'login');
  document.body.style.overflow='hidden';
}

function closeAuth(){
  const m = document.getElementById('authModal');
  if(!m) return;
  m.classList.remove('show');
  setTimeout(()=>{m.style.display='none';document.body.style.overflow=''},350);
}

function switchAuthView(view){
  document.getElementById('authLogin').style.display = view==='login'?'block':'none';
  document.getElementById('authRegister').style.display = view==='register'?'block':'none';
  document.getElementById('authForgot').style.display = view==='forgot'?'block':'none';
}

function togglePw(id){
  const inp = document.getElementById(id);
  inp.type = inp.type==='password'?'text':'password';
}

function checkPwStrength(pw){
  const bar = document.getElementById('pwBar');
  let score=0;
  if(pw.length>=8)score++;
  if(/[A-Z]/.test(pw))score++;
  if(/[0-9]/.test(pw))score++;
  if(/[^A-Za-z0-9]/.test(pw))score++;
  const colors=['#ff4444','#ff8800','#ffcc00','#44cc44'];
  const widths=['25%','50%','75%','100%'];
  bar.style.width=score>0?widths[score-1]:'0';
  bar.style.background=score>0?colors[score-1]:'transparent';
}

function socialLogin(provider){
  showToast('正在通过 '+{google:'Google',wechat:'微信',apple:'Apple'}[provider]+' 登录...','info');
  setTimeout(()=>{
    setLoggedIn({name:provider==='google'?'Google 用户':'用户',email:'user@example.com',provider:provider});
    showToast('登录成功！欢迎回来 ✨','success');
    closeAuth();
  },1500);
}

function emailLogin(e){
  e.preventDefault();
  const email=document.getElementById('loginEmail').value;
  const pw=document.getElementById('loginPassword').value;
  if(!email||!pw){showToast('请填写邮箱和密码','error');return;}
  showToast('正在登录...','info');
  setTimeout(()=>{
    setLoggedIn({name:email.split('@')[0],email:email,provider:'email'});
    showToast('登录成功！欢迎回来 ✨','success');
    closeAuth();
  },1200);
}

function emailRegister(e){
  e.preventDefault();
  const name=document.getElementById('regName').value;
  const email=document.getElementById('regEmail').value;
  const pw=document.getElementById('regPassword').value;
  if(!name||!email||!pw){showToast('请填写所有字段','error');return;}
  if(pw.length<8){showToast('密码至少需要 8 位','error');return;}
  showToast('正在创建账户...','info');
  setTimeout(()=>{
    setLoggedIn({name:name,email:email,provider:'email'});
    showToast('注册成功！欢迎加入拟像 🎬','success');
    closeAuth();
  },1500);
}

function forgotPassword(e){
  e.preventDefault();
  const email=document.getElementById('forgotEmail').value;
  if(!email){showToast('请输入邮箱地址','error');return;}
  showToast('重置链接已发送至 '+email+' 📧','success');
  setTimeout(()=>switchAuthView('login'),2000);
}

function setLoggedIn(user){
  currentUser=user;
  document.getElementById('navLoginBtn').style.display='none';
  document.getElementById('navUser').style.display='flex';
  document.getElementById('navAvatarChar').textContent=user.name.charAt(0).toUpperCase();
}

function logOut(){
  currentUser=null;
  document.getElementById('navLoginBtn').style.display='';
  document.getElementById('navUser').style.display='none';
  toggleUserMenu();
  showToast('已退出登录','info');
}

function toggleUserMenu(){
  document.getElementById('userMenu').classList.toggle('show');
}

// Close user menu on outside click
document.addEventListener('click',function(e){
  const u=document.getElementById('navUser');
  if(u&&!u.contains(e.target)){document.getElementById('userMenu').classList.remove('show');}
});

// Close modals on overlay click
document.getElementById('authModal').addEventListener('click',function(e){if(e.target===this)closeAuth();});
document.getElementById('checkoutModal').addEventListener('click',function(e){if(e.target===this)closeCheckout();});

// Close modals on ESC
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeAuth();closeCheckout();}});

function handleStartCreate(){
  if(!currentUser){openAuth();return;}
  goPage('creation');
}

/* ═══════════════════════════════════════════════════════════
   PRICING SYSTEM
   ═══════════════════════════════════════════════════════════ */

function toggleBilling(force){
  if(typeof force==='boolean') isYearly=force; else isYearly=!isYearly;
  document.getElementById('billToggle').classList.toggle('active',isYearly);
  document.getElementById('billMonthly').classList.toggle('active',!isYearly);
  document.getElementById('billYearly').classList.toggle('active',isYearly);
  document.getElementById('proPriceNum').textContent=isYearly?'79':'99';
  document.getElementById('proPricePeriod').textContent=isYearly?'/月 (年付)':'/月';
  document.getElementById('entPriceNum').textContent=isYearly?'319':'399';
  document.getElementById('entPricePeriod').textContent=isYearly?'/月 (年付)':'/月';
}

function handlePricingCTA(plan){
  if(plan==='free'){
    if(!currentUser){openAuth('register');return;}
    showToast('你已在使用入门版！','info');return;
  }
  if(plan==='enterprise'){
    showToast('我们的销售团队将在 24 小时内与你联系 📞','success');return;
  }
  if(!currentUser){openAuth();showToast('请先登录再订阅','info');return;}
  openCheckout(plan);
}

/* ═══════════════════════════════════════════════════════════
   CHECKOUT / PAYMENT SYSTEM
   ═══════════════════════════════════════════════════════════ */

let selectedPayMethod = 'stripe';
let checkoutPlan = 'pro';

function openCheckout(plan){
  checkoutPlan = plan||'pro';
  const p = plans[checkoutPlan];
  const price = isYearly ? p.yearlyPrice : p.monthlyPrice;
  const cycle = isYearly ? '按年计费 (月均)' : '按月计费';
  
  document.getElementById('checkoutPlanName').textContent = p.name;
  document.getElementById('checkoutPlanCycle').textContent = cycle;
  document.getElementById('checkoutPlanPrice').textContent = '¥'+price+'/月';
  
  const totalAmount = isYearly ? '¥'+(price*12)+'.00' : '¥'+price+'.00';
  document.getElementById('alipayAmount').textContent = totalAmount;
  document.getElementById('wechatAmount').textContent = totalAmount;
  
  document.getElementById('checkoutStep1').style.display='block';
  document.getElementById('checkoutStep2').style.display='none';
  
  selectPayMethod('stripe');
  
  const m = document.getElementById('checkoutModal');
  m.style.display='flex';
  requestAnimationFrame(()=>m.classList.add('show'));
  document.body.style.overflow='hidden';
}

function closeCheckout(){
  const m = document.getElementById('checkoutModal');
  if(!m) return;
  m.classList.remove('show');
  setTimeout(()=>{m.style.display='none';document.body.style.overflow=''},350);
}

function selectPayMethod(method){
  selectedPayMethod = method;
  ['stripe','alipay','wechatpay','googlepay'].forEach(m=>{
    const el=document.getElementById('pm-'+m);
    const panel=document.getElementById('pay'+m.charAt(0).toUpperCase()+m.slice(1));
    if(el) el.classList.toggle('active',m===method);
    if(panel) panel.style.display=m===method?'block':'none';
  });
}

function formatCardNumber(inp){
  let v=inp.value.replace(/\s/g,'').replace(/[^0-9]/g,'');
  v=v.match(/.{1,4}/g);
  inp.value=v?v.join(' '):'';
}

function formatExpiry(inp){
  let v=inp.value.replace(/[^0-9]/g,'');
  if(v.length>=2)v=v.slice(0,2)+' / '+v.slice(2,4);
  inp.value=v;
}

function processPayment(method){
  const btn=document.getElementById('btnStripeCheckout');
  const spinner=document.getElementById('stripeSpinner');
  
  if(method==='stripe'){
    const name=document.getElementById('cardName').value;
    const num=document.getElementById('cardNumber').value.replace(/\s/g,'');
    const exp=document.getElementById('cardExpiry').value;
    const cvc=document.getElementById('cardCvc').value;
    if(!name||num.length<16||!exp||!cvc){showToast('请填写完整的卡片信息','error');return;}
  }
  
  btn.disabled=true;
  spinner.style.display='inline-block';
  btn.querySelector('span:first-child').textContent='处理中...';
  
  // Simulate Stripe API call
  setTimeout(()=>{
    btn.disabled=false;
    spinner.style.display='none';
    btn.querySelector('span:first-child').textContent='确认支付';
    showPaySuccess();
  },2500);
}

function simulateQRPay(){
  showToast('扫码支付处理中...','info');
  setTimeout(()=>showPaySuccess(),2000);
}

function showPaySuccess(){
  document.getElementById('checkoutStep1').style.display='none';
  document.getElementById('checkoutStep2').style.display='block';
  document.getElementById('successMsg').textContent='你已成功订阅'+plans[checkoutPlan].name+'，开始尽情创作吧';
  showToast('支付成功！🎉','success');
}

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════════ */

let toastTimer;
function showToast(msg,type){
  const t=document.getElementById('toast');
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  t.className='toast-notify '+(type||'info');
  document.getElementById('toastMsg').textContent=msg;
  t.querySelector('.toast-icon').textContent=icons[type]||icons.info;
  clearTimeout(toastTimer);
  requestAnimationFrame(()=>t.classList.add('show'));
  toastTimer=setTimeout(()=>t.classList.remove('show'),3500);
}


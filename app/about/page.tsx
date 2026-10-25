import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "关于诗意江山", description: "了解诗意江山的内容范围、编辑原则、素材来源与 beta 版本计划。" };

export default function AboutPage() {
  return (
    <>
      <header className="page-intro page-shell">
        <nav className="breadcrumbs" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>关于</span></nav>
        <h1>诗意江山</h1>
        <p>一座可以慢慢阅读和聆听的数字诗词册页。我们相信，古典诗歌并不遥远，它只是等待一个合适的入口。</p>
      </header>
      <div className="page-shell about-grid">
        <aside className="about-nav"><span className="section-kicker">ABOUT THE PROJECT</span><div>编辑原则</div><div>视听素材</div><div>版本说明</div></aside>
        <div className="about-content">
          <section><h2>从一首诗出发</h2><p>诗意江山 v1.0 beta 首批收录十二首作品，以唐诗、宋词为主，同时上溯《诗经》与东晋田园诗。每首作品均包含原文、白话译文、创作背景、作者小传、作品赏析与古意情怀解读，并配有一幅水墨插画和可播放的背景音乐。</p><p>网站以内容阅读为核心，不设置登录、评论或信息流推荐。你可以从朝代、作者、题材和体裁进入，也可以直接搜索一个名字、一句诗或一种心事。</p></section>
          <section><h2>内容编辑原则</h2><p>原文采用通行整理本并保留规范标点；诗按句分行，词按片分段，词序随原文呈现。译文力求准确自然，不把赏析中的想象混入原意。</p><p>创作背景区分可确认史实与合理推测。对生平资料有限的作者，不作戏剧化补写；对存在争议的作品系年、字句异文和意象解释，保留必要的不确定性。每首详情页列有参考来源，赏析文字属于本站编辑性解读。</p></section>
          <section><h2>插画与音乐</h2><p>本版插图为项目以本地矢量绘制生成的原创水墨风格素材，并非古代画作或历史场景复原。画面只承担意境引导，不替代对原文的理解。</p><p>背景音乐由程序化合成的五声音阶器乐氛围构成，不是古曲录音，也不是历史乐谱复原。音频默认关闭，只有主动点击后才会播放。所有配图与音乐均随本站使用，无外部追踪和第三方播放请求。</p></section>
          <section><h2>v1.0 beta</h2><div className="beta-note"><p>当前版本处于公开测试阶段，重点验证内容结构、分类搜索、响应式阅读和音频体验。篇目数量与部分赏析文字仍会继续校订。</p></div><p>后续版本将优先扩充内容、增加简繁阅读与诗词朗诵，而不是堆积干扰阅读的功能。</p></section>
        </div>
      </div>
    </>
  );
}

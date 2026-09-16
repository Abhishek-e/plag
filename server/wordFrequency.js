// Tiered English word-frequency lists used as a lightweight proxy for
// per-word "surprisal" (how predictable a word is), since we don't have
// access to a trained language model's token probabilities.
// Tier 1 = extremely common function/core words, Tier 2 = common general
// vocabulary. Anything else is treated as comparatively rare.

export const TIER1_WORDS = new Set(
  `the be to of and a in that have i it for not on with he as you do at
  this but his by from they we say her she or an will my one all would
  there their what so up out if about who get which go me when make can
  like time no just him know take people into year your good some could
  them see other than then now look only come its over think also back
  after use two how our work first well way even new want because any
  these give day most us is was are been has had were said did going
  more very much many need may might must should being here where too
  such own same both those own down off own again around before while
  never every under through still such between during without against
  among since among within upon toward until although yet however thus`
    .split(/\s+/)
    .filter(Boolean)
);

export const TIER2_WORDS = new Set(
  `however therefore important example different system process
  development research information result analysis significant specific
  particular various several including provide support create increase
  reduce improve understand consider determine identify establish
  demonstrate indicate suggest reveal represent environment society
  government economic social technology education health student school
  world country community family business company market product
  service customer employee management strategy policy public private
  national international global local modern traditional digital online
  data study report article book chapter section paragraph sentence word
  language culture history science scientific theory concept idea issue
  problem solution challenge opportunity benefit advantage disadvantage
  impact effect cause reason purpose goal objective outcome conclusion
  summary introduction background context framework approach method
  technique tool resource source reference evidence fact detail example
  case situation condition factor element component aspect feature
  characteristic quality value level degree rate amount number
  percentage average total overall generally typically frequently
  commonly rarely occasionally ultimately essentially primarily largely
  significantly considerably substantially relatively increasingly
  additionally furthermore moreover nevertheless nonetheless consequently
  accordingly subsequently meanwhile alternatively similarly likewise
  regarding concerning throughout despite perhaps possibly likely unlikely
  necessary sufficient appropriate relevant crucial vital essential
  fundamental critical major minor primary secondary complex simple
  effective efficient successful positive negative potential actual
  current future past present recent contemporary emerging existing
  growing declining changing evolving improving worsening rising falling`
    .split(/\s+/)
    .filter(Boolean)
);

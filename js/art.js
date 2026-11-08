/* 装饰插图（线描 SVG）与字符画（ASCII art）。字符画只用 ASCII 字符，保证等宽对齐。沿用 Fuxi 复习站的画法。 */
window.GEWU_ART = (function () {
  var R = String.raw;

  var svg = {
    chinese: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<rect class="fill" x="24" y="14" width="112" height="72" rx="2"/>' +
      '<path d="M20 9v82M140 9v82" stroke-width="6"/>' +
      '<path d="M34 72 L56 40 L68 56 L86 30 L112 72"/>' +
      '<path d="M78 40 l8 -10 l6 8" class="thin"/>' +
      '<circle cx="114" cy="32" r="7" class="fill"/>' +
      '<path d="M34 78 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0" class="thin"/>' +
      '<path d="M46 26 h18 M46 32 h12" class="thin"/>' +
      '</svg>',
    history: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<path d="M14 40 Q40 34 80 22 Q120 34 146 40" stroke-width="2.6"/>' +
      '<path d="M14 40 q-4 -2 -6 -7 M146 40 q4 -2 6 -7" class="thin"/>' +
      '<rect class="fill" x="34" y="40" width="92" height="16"/>' +
      '<path d="M44 40v16M60 40v16M76 40v16M84 40v16M100 40v16M116 40v16" class="thin"/>' +
      '<path d="M22 60 Q50 54 80 50 Q110 54 138 60"/>' +
      '<rect class="fill" x="24" y="60" width="112" height="28"/>' +
      '<path d="M70 88 v-14 a10 10 0 0 1 20 0 v14 M40 88 v-10 a6 6 0 0 1 12 0 v10 M108 88 v-10 a6 6 0 0 1 12 0 v10"/>' +
      '<path d="M8 92 H152" class="thin"/>' +
      '</svg>',
    biology: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<circle cx="40" cy="50" r="13" class="fill"/>' +
      '<circle cx="40" cy="50" r="4" class="solid"/>' +
      '<path d="M30 42 L14 26 M14 26 l-6 2 M14 26 l0 -7 M28 54 L10 64 M10 64 l-4 -5 M10 64 l0 7 M38 37 L34 16 M34 16 l-6 -3 M34 16 l5 -5 M46 62 L50 82" class="thin"/>' +
      '<path d="M53 50 H124"/>' +
      '<rect class="fill" x="60" y="45" width="12" height="10" rx="5"/><rect class="fill" x="78" y="45" width="12" height="10" rx="5"/><rect class="fill" x="96" y="45" width="12" height="10" rx="5"/>' +
      '<path d="M124 50 l14 -12 M124 50 l16 0 M124 50 l14 12" class="thin"/>' +
      '<circle cx="139" cy="37" r="2.5" class="solid"/><circle cx="141" cy="50" r="2.5" class="solid"/><circle cx="139" cy="63" r="2.5" class="solid"/>' +
      '</svg>',
    geography: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<path class="fill" d="M6 34 L18 22 L26 30 L36 18 L48 34 V54 H98 V74 H154 V94 H6 Z"/>' +
      '<path d="M32 22 l4 -4 l4 5" class="thin"/>' +
      '<path d="M14 42 q14 6 26 4 q20 10 34 8 q16 12 30 14 q16 10 34 12 q10 2 14 4" class="river"/>' +
      '<circle cx="132" cy="22" r="8" class="fill"/>' +
      '<path d="M120 86 q4 -3 8 0 t8 0 t8 0 t8 0" class="thin"/>' +
      '<text x="22" y="48" class="small">1</text><text x="70" y="68" class="small">2</text><text x="124" y="84" class="small">3</text>' +
      '</svg>',
    physics: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<path d="M6 50 H154" class="dash"/>' +
      '<path class="fill" d="M66 12 Q82 50 66 88 Q50 50 66 12 Z"/>' +
      '<path d="M8 28 H64 L116 50"/><path d="M8 72 H64 L116 50"/><path d="M8 50 H116" class="thin"/>' +
      '<path d="M116 50 L152 66 M116 50 L152 34" class="thin"/>' +
      '<circle cx="116" cy="50" r="3.2" class="solid"/>' +
      '<text x="112" y="66" class="small">F</text><text x="62" y="98" class="small">O</text>' +
      '<path d="M10 12 q4 -6 8 0 t8 0 t8 0 t8 0" class="thin"/>' +
      '<path d="M128 16 l6 -6 l6 6 l-6 6 z" class="thin"/>' +
      '</svg>',
    model: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<path class="fill" d="M80 12 L37 87 L84 54 Z"/>' +
      '<path d="M80 12 L37 87 L123 87 Z"/>' +
      '<path d="M80 12 L84 54 L118 30 Z" class="fill"/>' +
      '<path d="M37 87 L84 54" stroke-width="2.8"/>' +
      '<path d="M123 87 L118 30" stroke-width="2.8"/>' +
      '<path d="M80 12 m-9 15 a17 17 0 0 0 18 0" class="thin"/>' +
      '<text x="76" y="9">A</text><text x="27" y="96">B</text><text x="125" y="96">C</text><text x="78" y="66">D</text><text x="121" y="28">E</text>' +
      '</svg>',
    motion: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<path class="fill" d="M80 12 L22 86 L138 86 Z"/>' +
      '<path d="M51 49 L70 86" stroke-width="2.6"/><path d="M70 86 L104 46" stroke-width="2.6"/>' +
      '<circle cx="51" cy="49" r="3.2" class="solid"/><circle cx="70" cy="86" r="4" class="solid"/><circle cx="104" cy="46" r="3.2" class="solid"/>' +
      '<path d="M30 95 H96 M90 91 l6 4 l-6 4" class="thin"/>' +
      '<text x="76" y="9">A</text><text x="10" y="94">B</text><text x="140" y="94">C</text><text x="40" y="47" class="small">D</text><text x="108" y="44" class="small">Q</text><text x="66" y="80" class="small">P</text>' +
      '</svg>'
  };

  var ascii = {
    chinese: R`
       |          .   *    .
      |||        /\
      |||   /\  /  \   /\
      \_/  /  \/    \_/  \
       V  / ~~~ ~~~~ ~~~  \
    ======================== `,
    history: R`
       _   _   _            _   _   _
   ___| |_| |_| |___    ___| |_| |_| |___
  |   _   _   _     |__|     _   _   _   |
  |__| |_| |_| |___________| |_| |_| |___|
  1840 ---- 1894 ---- 1911 ---- 1919 ---- 1949`,
    home: R`
        __...--~~~~~-._   _.-~~~~~--...__
      //               \ /               \\
     //   3 TOPICS      |   RESEARCH      \\
    //__...--~~~~~~-._  |  _.-~~~~~~--...__\\
  ====================\\ | //====================
                      '---'`,
    biology: R`
    \   |   /
     \  |  /
   ---( @ )--[==]--[==]--[==]---<
     /  |  \
    /   |   \
  receptor -> nerve -> center -> effector`,
    geography: R`
   /\/\__ 1
  /      \____________ 2
 /                    \_____________ 3
/  W                              E \~~~~ sea
'---------------------------------------'`,
    motion: R`
         A
        / \       BP = 3t
       D   Q       PC = 8 - 3t
      / \ / \     CQ = v t
     B---P---C     t = ?
      ---> 3 cm/s`,
    physics: R`
            |
  ------->-(|)--.
  ------->-(|)---*------ F
  ------->-(|)--'
            |
  v = s / t      rho = m / V`,
    model: R`
          A
         /|\
        / | \       AB = AC
       /  D--E      AD = AE
      /  /    \     <BAC = <DAE
     B--/------C    => BD = CE`,
    empty: R`
       /\_/\
      ( o.o )   all clear!
       > ^ <`,
    top: R`
       ___________
      '._==_==_=_.'
      .-\:      /-.
     | (|:.     |) |
      '-|:.     |-'
        \::.    /
         '::. .'
           ) (
         _.' '._
        '-------'`,
    good: R`
         .   *   .
       *  \  |  /  *
      .  -- ( ) --  .
       *  /  |  \  *
         '   *   '`,
    keep: R`
        ______
       |      |__
       |  ok  |  |   keep going!
       |______|__|
         /    \
        /______\ `
  };

  return { svg: svg, ascii: ascii };
})();

/* 装饰插图（线描 SVG）与字符画（ASCII art）。字符画只用 ASCII 字符，保证等宽对齐。沿用 Fuxi 复习站的画法。 */
window.GEWU_ART = (function () {
  var R = String.raw;

  var svg = {
    biology: '<svg class="art-svg" viewBox="0 0 160 100" aria-hidden="true">' +
      '<circle cx="40" cy="50" r="13" class="fill"/>' +
      '<circle cx="40" cy="50" r="4" class="solid"/>' +
      '<path d="M30 42 L14 26 M14 26 l-6 2 M14 26 l0 -7 M28 54 L10 64 M10 64 l-4 -5 M10 64 l0 7 M38 37 L34 16 M34 16 l-6 -3 M34 16 l5 -5 M46 62 L50 82" class="thin"/>' +
      '<path d="M53 50 H124"/>' +
      '<rect class="fill" x="60" y="45" width="12" height="10" rx="5"/><rect class="fill" x="78" y="45" width="12" height="10" rx="5"/><rect class="fill" x="96" y="45" width="12" height="10" rx="5"/>' +
      '<path d="M124 50 l14 -12 M124 50 l16 0 M124 50 l14 12" class="thin"/>' +
      '<circle cx="139" cy="37" r="2.5" class="solid"/><circle cx="141" cy="50" r="2.5" class="solid"/><circle cx="139" cy="63" r="2.5" class="solid"/>' +
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
      '</svg>'
  };

  var ascii = {
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

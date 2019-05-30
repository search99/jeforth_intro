/*
    jeForth
    A minimalist Forth Implementation in Javascript
    BSD license
    
    2011/12/23  initial version by yapcheahshen@gmail.com
                equiv to http://tutor.ksana.tw/ksanavm lesson1~8
                
    TODO: complete eForth core word set
          interface to HTML5 canvas
          port C.H.Ting flag demo for kids
          
    this is merely a kick off, everyone is welcome to enhance it.
    
    2012/2/17 add example and modify kernel to be more friendly for education.
*/
"uses strict";
(function() {
  function JeForthVm() {
    var stack = [] , rstack =[]; 
    var dictionary = [];
    var tib="", ntib=0 , here=0
    var newname,newxt;                       // word under construction
    var ip=0;                                // instruction pointer
    var abortexec=false, compiling=false;
    function nexttoken() {                   // fetch a token from tib
        var token="";
        while (tib.substr(ntib,1)==' ') ntib++;
        while (ntib<tib.length && tib.substr(ntib,1)!=' ') token+=tib.substr(ntib++,1);
        return token;
    }
    function dictcompile(n) {dictionary[here++]=n;} 
    function reset() { abortexec=1;  stack=[]; rstack=[]; }
    function findword(name) {
        for (var i=words.length-1;i>-1;i--)  {
           if (words[i].name===name)  break;
        }
        return i;
    }
    function compilecode(wordname) { 
      var nword=findword(wordname);    
      if (nword>-1) dictcompile(words[nword].xt) ; else throw "unknown word "+wordname ;
    }
    function execute(xt) {                   // run a word 
        if (typeof(xt)==="function") xt() ;  // primitive , execute it directly
        else {  call(xt);}                   // make a high level call
    }
    function call(address) {                 // inner loop
        abortexec=false;
        ip=address;
        do {
            var addr=dictionary[ip++];       // fetch code and move IP to next cell
            if (typeof(addr) ==="function") {
                addr();
            } else {
                rstack.push(ip);
                call(addr);
            }   
        } while (!abortexec);
    }
    function exit() {                        // high level return
        if (rstack.length===0) { abortexec=true;    return;   }
        ip=rstack.pop();                     // back to caller
    }
    function exec(cmd) {                     // outer loop
        tib=cmd; ntib=0;   
        do {
          var token=nexttoken();
          if (token==="") break;
          var n=parseFloat(token);           // convert to number, javascript allow parseInt(str,base)
          var nword=findword(token);
          if (nword>-1) { 
              var w=words[nword];
              if (compiling && !w.immediate) {
                 dictcompile(w.xt);
              } else {
                 execute(w.xt);
              }
           } else if (n || token==="0") {     // if the token is a number
              if (compiling) {  
                dictcompile(doLit);           // compile an literal
                dictcompile(n);
              } else {  
                stack.push(n);
              }
          } else {
            panic("? "+token); cr(); return ; // unknown word
          }
        } while (true) ;
        systemtype("ok");cr();
  }
  function doCol()   { };
  function doVar()   {stack.push(ip); exit(); };
  function doLit()   {stack.push(dictionary[ip++]); }
  var words = [
     {name:"dup"   ,xt:function dup()      {stack.push(stack[stack.length-1]);}}
    ,{name:"."     ,xt:function dot()      {systemtype(stack.pop()+" ");}}
    ,{name:"*"     ,xt:function multiply() {stack.push(stack.pop()*stack.pop());}}
    ,{name:":"     ,xt:function colon()    {newname=nexttoken();newxt=here; dictcompile(doCol); compiling=true; }}
    ,{name:";"     ,xt:function semicolon(){compiling=false; dictcompile(exit); words.push({name:newname,xt:newxt}) } , immediate: true }
    ,{name:"create",xt:function create()   {newname=nexttoken(); words.push({name:newname,xt:here}); dictcompile(doVar);}}
    ,{name:"@"     ,xt:function fetch()    {stack.push(dictionary[stack.pop()]);}}
    ,{name:"!"     ,xt:function store()    {dictionary[stack.pop()]=stack.pop();}}
    ,{name:","     ,xt:function comma()    {dictcompile(stack.pop());}}
    ,{name:"does"  ,xt:function does()     {dictionary[words[words.length-1].xt] =ip; exit() ; }}
    ,{name:"r>"    ,xt:function rfrom()    {stack.push(rstack.pop());}} 
  ];
  function cr() {   systemtype("\n"); }   // start a new line
  function systemtype(t) {if (this.ticktype) this.ticktype(t);}  // define in HTML UI
  function panic(msg) {systemtype(msg);reset();}
  this.dictionary=dictionary;             // export for easier debugging
  this.stack=stack;
  this.words=words;
  this.exec= exec;  
  this.ticktype=0;                        // 'type vector
}
window.JeForthVm=JeForthVm;               // export JeForthVm as a global variable
})();
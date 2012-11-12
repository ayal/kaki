dbalbums = new Meteor.Collection("dbalbums");
LFM_API_KEY = '13d380964e80e47a5a9c6daa29d0b8e0';

Meteor.methods({
  saveAlbum: function(calb) {
    if (this.is_simulation) {
      var scrltp = $('.marks').scrollTop();
      window.restoreScroll = function(){
        setTimeout(function(){
//            $('.marks').scrollTop(scrltp);
        }, 1000);
        
      };
      window.calb = calb;
      return '';
    }
    
    console.log('saving..', calb.album);
    _.each(calb.marks, function(mrk) {
      mrk.start = parseFloat(mrk.start);
      mrk.end = parseFloat(mrk.end);
    });

    var already = dbalbums.findOne({key: calb.key});
    if (!already) {
      console.log('saving new song');
      dbalbums.insert(calb);   
    }
    else {
      console.log('updating song with', already._id, calb);
      dbalbums.update({_id: already._id}, calb);
    }

    return dbalbums.findOne({key: calb.key});;
  }
});


if (Meteor.is_client) {
  console.log();
  window.moveword = function(i, time, stop) {
    var text = $('.subtitle.selected').text();
    var words = text.split(' ');
    var word = words[i];
    if (!word || stop) {
      return;
    }

    idx = text.indexOf(word);
    window.moveit(time / words.length,
		  $('.subtitle.selected').position().left + idx * 15,
		  function(){
		    moveword(++i, time); 
		  });
  };

  $(document).bind('showsub', function(e, opts) {
    console.log(opts);
/*    setTimeout(function(){
      try {
	window.floor = $('.subtitle.selected').offset().top;
	window.bally = window.floor - 70;
	window.bounce(100000, function() {
	});


	moveword(0, (opts.end - opts.start) * 1000);


	// window.moveit((opts.end - opts.start) * 1000, 
	// 						  $('.subtitle.selected').offset().left + $('.subtitle.selected').width() , function(){
	// 						  });
	
      } catch (x) {

      }
      
    }, 500);*/

    /*			 var text = $('.lyrics').text();
			 var optstext = opts.text.replace('...', '');
			 if (!optstext.trim()) {
			 return;
			 }
			 var idx = text.indexOf(optstext);
			 $('.lyrics')[0].selectionStart = idx;
			 $('.lyrics').stop(true, true).animate({selectionEnd: idx + optstext.length},
			 1000 * (opts.end - opts.start));*/
    //			 $('.subtitle.selected').animate({});
  });
  window.wait = false;
  window.equals = function(tis, x) {
    var p;
    for(p in tis) {
      if(typeof(x[p])=='undefined') {
	return false;}
    }

    for(p in tis) {
      if (tis[p]) {
	
	switch(typeof(tis[p])) {
	  
	 case 'object':
          if (!tis[p].equals(x[p])) {
	    return false; } break;
	 case 'function':
          if (typeof(x[p])=='undefined' ||
	      (p != 'equals' && tis[p].toString() != x[p].toString()))
	    return false;
          break;
	default:
          if (tis[p] != x[p]) { return false; }
	}
      } else {
	if (x[p])
	  return false;
      }
    }

    for(p in x) {
      if(typeof(tis[p])=='undefined') {return false;}
    }

    return true;
  };

  regit = function(re, str) {
    var arr = [];
    var match = null;
    while (match = re.exec(str)) {
      var obj = {};
      for (var grp = 1; grp < match.length; grp++) {
	obj[grp] = match[grp];
      }
      arr.push(obj);
    }
    return arr;
  };

  window.marks = [];

  window.tracks = [];

  window.dolfm = function(album, artist, cb) {
    $.getJSON('http://ws.audioscrobbler.com/2.0/?'
	      + 'method=album.search&album=' +
	     artist + ' ' + album +
	      '&api_key=' + LFM_API_KEY + '&format=json',
	      function(res) {
		var arr = res.results.albummatches.album.length ?
		  res.results.albummatches.album : [res.results.albummatches.album];
		$.each(arr, function(i, alb) {
		  if (alb.artist.toLowerCase()
		      .indexOf(artist.toLowerCase()) !== -1 ||
		      artist.toLowerCase()
		      .indexOf(alb.artist.toLowerCase()) !== -1) {
		    $.getJSON('http://ws.audioscrobbler.com/2.0/?'
			      + 'api_key=' + LFM_API_KEY + '&'
			      + 'method=album.getinfo&mbid=' + alb.mbid +
			      '&format=json&callback=?', function(data) {
				cb(data);
			      });
		    return false;
		  }
		});
	      });
  };



  window.getTracks = function(album, artist, article, cb) {
    if (!article) {
      $.getJSON('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='
		+ encodeURIComponent(album + ' album ' + artist) +
		'&format=json&callback=?', function(srch) {
		  var thearticle = srch.query.search[0].title;
		  article = thearticle;
		  if (window.clean(thearticle).indexOf(window.clean(album)) === -1 &&
		      window.clean(album).indexOf(window.clean(thearticle)) === -1) {
		    
		    thearticle = null; 
		    var oknomore = false;
		    $.each(srch.query.search, function(i, sr) {
		      if ((window.clean(sr.title).indexOf(window.clean(album)) !== -1 ||
			   window.clean(album).indexOf(window.clean(sr.title)) !== -1) && !oknomore) {
			article = thearticle = sr.title;
			oknomore = true;
		      }
		    });
		  }
		  getTracks(album, album, article, cb);
		});
    }
    else {
      $.getJSON('http://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=' + article + '&rvprop=timestamp|user|comment|content&format=json&callback=?', function(e) {
	if (!Object.keys(e.query.pages) || !e.query.pages[Object.keys(e.query.pages)[0]].revisions) {
	  return;
	}
	var xx = e.query.pages[Object.keys(e.query.pages)[0]].revisions[0]['*'];

	var alb = {};

	//var tracks = regit(/(\W*?)([\w|\s]*?)(\W*?)(\d{1,2}:\d{1,2})/gim, xx);
	var tracks = [];

	tracks = regit(/title\d+.*?=\s*(.*?)\|length/gim, xx);

	if (tracks.length <= 1) {
	  tracks = regit(/title\d.*?=.(.*?)$/gim, xx);
	}

	if (tracks.length <= 1) {
	  //tracks = regit(/[^a-zA-Z0-9\[\]]*([a-zA-Z\s'0-9\(\),\[\]\\/|]*)([^a-zA-Z\s'0-9\(\),\[\/\]\|].*?)\d:\d{2}/gim, xx);
	  
	  tracks = regit(/#\s"(.*?)"\s.*?\d:\d{2}/gim, xx);
	}


	if (tracks.length <= 1) {
	  tracks = regit(/#."(.*?)".\d:\d{1,2}/gim, xx);
	}
	

	if (tracks.length <= 1) {
	  tracks = regit(/#(.*?)\d:\d{1,2}/gim, xx);
	}
	
	if (tracks.length <= 1) { 
	  var theindex = xx.indexOf('==Track');
	  if (tracks.length <= 1) {
	    tracks = regit(/#.*?\"(.*?)\"/gim, xx);
	  }
	  if (tracks.length <= 1) {
	    tracks = regit(/#\s*(.*?)\n/gim, xx);
	  }
	  if (tracks.length <= 1) {
	    tracks = regit(/\n.\s(.*?)[^a-zA-Z0-9\s]/gim, xx.substr(theindex));
	  }

	}
	realTracks = [];

	$.each(tracks, function(i, obj) {
	  var thename = obj['1'];
	  if (thename.indexOf('[[') != -1) {
	    thename = thename
	      .split('|').splice(-1)[0]
	      .replace(/[\]\[]/gim,'');


	  }
	  
	  var theartist = artist.trim(' ');

	  try {
	    thename = thename.isASCII() ? thename : thename.deaccent();
	    theartist = theartist.isASCII() ? theartist : theartist.deaccent();
	  } catch (x) {

	  }
	  realTracks.push({
	    name: thename,
	    artist: {
	      name: theartist
	    },
	    album: album
	  });
	});

	/*			  thetracks = {};
			          for (var i = 0; i < realTracks.length; i++) {
			          
			          if (realTracks[i + 1] && !thetracks[window.clean(realTracks[i].name)]) {
			          thetracks[window.clean(realTracks[i].name)] = realTracks[i + 1].name;	  
			          }
			          }*/

	$.each(realTracks, function(i, t) {
	  t.link = '/' + 
	    window.mode + '/' + 
	    encodeURIComponent(window.artist) + '/' +
	    encodeURIComponent(window.album) + '/' + 
	    encodeURIComponent(t.name);
	});
	cb(realTracks);
      });
    }
  };
  window.getLyrics = function(artist, song, next) {

    if (!artist) {
      next();
      return;
    }
/*    window.getlyr = $.getJSON('http://apitutapi.appspot.com/lylo?url=http://www.lyricsmania.com/' +
			      window.clearics(song) +
			      '_lyrics_' + window.clearics(artist) +
			      '.html&callback=?')*/
    window.getlyr = $.getJSON('http://apitutapi.appspot.com/xylo?url=http://rapgenius.com/' +
                              firstcap(window.clearics(artist)) + '-' +
			      window.clearics(song) +
			      '-lyrics' + '&callback=?')
      .done(next)
      .fail(function(){

      });
    setTimeout(function(){
      if (window.getlyr.state() !== 'resolved') {
        next();
      }
    }, 5000);
  };

  window.fetchFromPipe = function() {
    var tracks = [{
      artist: {
	name: artist
      },
      name: song,
      album: album
    }];
    
    var vidreadiez = [];

    $.each(tracks, function(trki, trk) {
      var cleantrk = window.clean(trk.name);
      if (cleantrk === 'length') {
	return;
      }
      

      var vidready = $.Deferred();
      vidreadiez.push(vidready);

      trk.artist.name = trk.artist.name.replace(/&/gim, 'and');

      var song = cleantrk.length > 30 ? trk.name : (trk.artist.name.toLowerCase() + ' ' + trk.name.toLowerCase());
      if (window.accurate) {
	song += ' ' + trk.album;
      }
      song = song.replace('&', 'and');
      
      var req = $.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + encodeURIComponent(song) + '&safeSearch=none&orderby=relevance&max-results=10&category=Music&v=2&alt=json&callback=?', function(e) {

	if (!e.feed.entry || e.feed.entry.length === 0) {
	  vidready.resolve();
	  return;
	}

	$.each(e.feed.entry, function(i, entry){
	  if (vidready.state() === 'resolved') {
	    return;
	  }

	  var cleanYTitle = window.clean(entry.title.$t);
	  var cleanartist = window.clean(trk.artist.name);

	  function nogood(what) {
            var desc = entry.media$group.media$description.$t;
            if (typeof what === 'string') {
              if ((cleanYTitle.indexOf(what) !== -1) &&
                  cleantrk.indexOf(what) === -1){
                
	        console.log('its a ' + what, 'srch:',
			    song,
			  'you said: ',
			  cleanartist,
			  cleantrk,
			  'tube said',
			  cleanYTitle);
	        return true;
	      }
            }
            else {
              if (what.test(cleanYTitle)&&
                  !what.test(cleantrk)){
                
	        console.log('its a ' + what, 'srch:',
			    song,
			    'you said: ',
			    cleanartist,
			    cleantrk,
			    'tube said',
			    cleanYTitle);
	        return true;
	      } 
            }

	    return false;
	  };


	  if (nogood(/\d{2}.\\d{2}/gim) || nogood('teaser') || nogood('cover') ||
	      nogood('live') || nogood('perform') ||
	      nogood('philhar')) {
	    return;
	  }

/*	  if (cleanYTitle.replace(cleantrk, '')
	      .replace(cleanartist, '')
	      .replace('new', '')
	      .replace('album', '')
	      .replace('lyrics','')
	      .replace('hd','')
	      .replace(/\d+p/gim,'')
	      .replace(window.clean(trk.album), '')
	      .length > 20){
	    console.log('too many guys', 'srch:',
			song,
			'you said: ',
			cleanartist,
			cleantrk,
			'tube said',
			cleanYTitle);
	    return;

	  }*/

	  if (cleanYTitle.replace('and', '').indexOf(cleantrk.replace('and', '')) === -1) {
	    console.log('no title.', 'srch:',
			song,
			'you said: ',
			cleanartist,
			cleantrk,
			'tube said',
			cleanYTitle);
	    return;
	  }

	  if (cleanYTitle.indexOf(cleanartist) === -1) {
	    var nothing = true;
	    $.each(entry.category,function(i, tag){
	      if (window.clean(tag.term).indexOf(cleanartist) !== -1){
		nothing = false;
	      }
	    });

	    if (nothing) {
	      console.log('no artist.', 'srch:',
			  song,
			  'you said: ',
			  cleanartist,
			  cleantrk,
			  'tube said',
			  cleanYTitle);
	      return;
	    }
	  }

	  var id = entry.id.$t.split(':').reverse()[0];
	  //							  thumbit(trk.name + ' ' + trk.artist.name, "//img.youtube.com/vi/" + id + "/0.jpg", 'track flaque', [256]);
	  var res = JSON.stringify({
	    id: id,
	    who_shared: 'takashirgb',
	    fromindie: true,
	    player: 'youtube_player',
	    viewCount: e.feed.entry[0].yt$statistics.viewCount,
	    favoriteCount: e.feed.entry[0].yt$statistics.favoriteCount,
	    ucount: e.feed.entry[0].yt$statistics.viewCount + e.feed.entry[0].yt$statistics.favoriteCount * 100
	  });
	  vidready.resolve(res);
	  return;
	});

	if (vidready.state() !== 'resolved') {
	  vidready.resolve();   
	}

      });

      $.when(req).fail(function() {
	//					console.log('failed. resolving');
	vidready.resolve();
      });
      setTimeout(
	function() {
	  if (req.state() !== 'resolved') {
	    console.log('timeout. resolving');
	    vidready.resolve();
	  }
	}, 5000);
    });
    return vidreadiez;
  };

  window.clean = function(s) {
    return s && s.toLowerCase().replace(/[^a-zA-Z0-9]/gim,'').trim(' ');

  };

  window.clearics = function(s) {
//    return s && s.toLowerCase().replace(/\s/gim, '_').replace(/[^a-zA-Z0-9\s_]/gim, '').trim(' ');
    return s && s.toLowerCase().replace(/\s/gim, '-').replace(/[^a-zA-Z0-9\s-]/gim, '').trim(' ');
  };

  window.firstcap = function(s){
    var f = s[0];
    return f.toUpperCase() + s.slice(1);
  };


  window.getkey = function(){
    if (!window.artist) {
      return '';
    }


    return window.clean(artist) + '_' + window.clean(song);
  };

  window.getsong = function(artist, song) {
    getLyrics(window.artist, window.song, function(lyrics) {
      lyrics = lyrics || '<div>no nothing</div>';
      lyrics = lyrics.replace(/\u00e2/gim, "'").replace(/[\u00c3\u00a2\u20ac\u2122]/gim,"'");
      
      var after = function(vid){
        var tube = vid.length === 11 ? 'http://www.youtube.com/watch?v=' + vid : 'http://vimeo.com/' + vid; 
	Meteor.call('saveAlbum', {key: window.getkey(), 
				  album: window.album,
				  artist: window.artist,
				  song: window.song,
				  lyrics: lyrics ? $(lyrics).text().trim() : '',
				  tube: tube},

		    function(e, curs) {		
		      console.log('saved', arguments);
                      window.restoreScroll();
		    });
	
      };
      
      if (window.vid) {
        after(window.vid);
      }
      else {
        if (!window.artist) {
            return;
        }
        $.when.apply($, fetchFromPipe(window.artist, window.song, window.album)).done(function(res) {
          if (!res) {
              return;
          }
	  after(JSON.parse(res).id)
        });
      }

    });
  };

  window.doit = function(){
    window.mode = 'doit';
  };

  window.edit = function(){
    window.mode = 'edit';
  };

  //backbone
  var AppRouter = Backbone.Router.extend({
    
    routes: {
      ":what/:artist/:album/:song": "main",
      ":what/:artist/:album/:song/": "main",
      ":what/:artist/:album/:song/:vid": "main"
    },
    main: function(what, artist, album, song, vid) {
      if (window[what]) {
        $('head').append($('<meta property="og:title" content="' + artist + ' - ' + song + ' @ KAKI" />'));
        $('head').append($('<meta property="og:image" content="http://kaki.meteor.com/jig.jpg" />'));

	window.artist = decodeURIComponent(artist);
	window.album = decodeURIComponent(album);
	window.song = decodeURIComponent(song);
	window.mode = what;
        window.vid = vid;

	window[what](artist, album, song);   
	dolfm(album, artist, function(trkz) {
	  trkz = trkz.album.tracks.track.length ? $.map(trkz.album.tracks.track, function(tr){
            var name = tr.name ? tr.name.toLowerCase() : tr.toLowerCase();
            name = name.replace('&', 'and');
	    return {artist: {name: artist}, 
		    album: album, 
		    name: name};}) : [{artist: {name: artist},
										     album: album,
										     name: trkz.album.tracks.track.name}];
	  $.each(trkz, function(i, t) {
	    t.link = '/' + 
	      window.mode + '/' + 
	      encodeURIComponent(window.artist) + '/' +
	      encodeURIComponent(window.album) + '/' + 
	      encodeURIComponent(t.name);
	  });

	  window.tracks = trkz;
	  Session.set('tracks', window.tracks);
	});
      }
    } 

  });

  window.app_router = new AppRouter();

  Backbone.history.start({pushState: true});

  window.renderpop = function(){

    window.renderpop = $.noop();
    window.popcorn = Popcorn.smart("#video", alb.tube);
  };

  window.pop = $.Deferred();

  Meteor.subscribe("hooky", function () {
    $(function(){
          $('.jig').hide();
    });

    var theone = dbalbums.findOne({key: window.getkey()});  
    if (!theone && window.artist && window.song) {
      window.getsong(window.artist, window.song);   
    }
  });
  Template.songs.songs = function () {
    var the = dbalbums.find({});
    var arr = [];
    the.forEach(function(x){
      if (x && x.lyrics && x.lyrics.length > 10) {
       arr.push(x);
      }
    });
    return arr;
  };

  Template.tracks.tracks = function () {
    return Session.get('tracks') || [];
  };

  Template.tracks.isthis = function () {
    return window.song === this.name ? 'selected' : 'nothing';
  };

  Template.lyrics.lyrics = function () {
    var xxx = window.getkey() ? dbalbums.findOne({key: window.getkey()}) : dbalbums.findOne({});
    if (!xxx) {
        return '';
    }
    return xxx.lyrics;
  };

  Template.video.video = function () {

    var xxx = window.getkey() ? dbalbums.findOne({key: window.getkey()}) : dbalbums.findOne({});
    if (!xxx) {
        return;
    }

    setTimeout(function(){
      window.popcorn = Popcorn.smart("#video", xxx.tube);
      setTimeout(function(){
	$('#canvas').attr('width', $('#video').width()).attr('height', $('#video').height() - 50)
	  .css('top', $('#video').offset().top)
	  .css('left', $('#video').offset().left);
      },1000);
      window.pop.resolve();
    },0);
  };

  Template.main.preserve({
      ".marks": function(node){         
        return node;
      }
  });

  Template.marks.marks = function () {
    var xxx = window.getkey() ? dbalbums.findOne({key: window.getkey()}) : dbalbums.findOne({});
    if (!xxx) {
        return [];
    }
    setTimeout(function(){
      pop.done(function(){
	if (xxx.marks) {

	  window.marks = xxx.marks;
	  
	  $.each(xxx.marks, function(i, mrk) {
            mrk.start = parseFloat(mrk.start);
            mrk.end = parseFloat(mrk.end);
	    window.popcorn = popcorn.subtitle(mrk);
	  });
	}
      });
    },0);
    if (!xxx.marks) {
      xxx.marks = [];
    }
    return xxx.marks.sort(function(a,b){return a.start - b.start;});
  };

  Template.main.mode = function () {
    return window.mode || 'edit';
  };

  Template.main.song = function () {
    if (!window.getkey()) {
        return dbalbums.findOne({});
    }
    var xxx = dbalbums.find({key: window.getkey()});
    return xxx;
  };

  window.lastplace = 0;
  window.lasttime = 0;
  Template.marks.events = {
    'click .alert': function() {
      popcorn.currentTime(this.start);
    },
    'click span.badge-success': function(e) {
      console.log(e);
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){
	if (window.equals(x, that)) {
          that.start = (e.ctrlKey ? parseFloat(that.start)-0.25 : parseFloat(that.start)+0.25);
	  return that;
	}
	return x;
      });

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
                    window.restoreScroll();
		    console.log('saved', arguments);
		  });



    },
    'click span.badge-info': function(e) {
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){
	if (window.equals(x, that)) {
          that.end = (e.ctrlKey ? parseFloat(that.end)-0.25 : parseFloat(that.end)+0.25);
	  return that;
	}
	return x;
      });

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
                    window.restoreScroll();
		    console.log('saved', arguments);
		  });



    },
    'click .alert .close': function() {
      console.log(arguments);
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){
	if (window.equals(x, that)) {
	  return null;
	} 
	return x;
      });

//      dbalbums.update(theone._id, theone);
      
      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
                    window.restoreScroll();
		    console.log('saved', arguments);
		  });
      
      return false;
    }
  };

  window.sylz = [];
  window.syldx = 0;

  $(document).keypress(function(){
    if ( event.which === 100 ) {
      window.sylz.push('break'); 
      return;
    }

    if ( event.which === 115 ) {
      var thistime = window.popcorn.currentTime();
      var syl = {
	time: Math.max(0, thistime - 1.4),
	idx: window.syldx
      };
      window.syldx++;
      window.sylz.push(syl);			       
    }
  });
  

  window.sentences = function(){
    var theone = dbalbums.findOne({key: window.getkey()});
    window.allwords = $('.lyrics').val().replace(/\n/gim, ' ').replace(/-/gim, ' ').split(' ');
    var sent = [];
    $.each(theone.sylz, function(i, syl){
      if (syl === 'break') {
	console.log(sent.join(' '));
	sent = [];
	return;
      }
      var before = theone.sylz[i - 1] !== 'break' ? theone.sylz[i - 1] : theone.sylz[i - 2];
      var delta = i > 0 ? syl.time - before.time : 0;
      if (delta < 0.42) {
	sent.push(allwords[syl.idx]);
      }
      else {
	console.log(sent.join(' '));
	sent = [];
	sent.push(allwords[syl.idx]);
      }		   
    });
  };

  Template.main.events = {
    'click .lyrics': function(){
      if (window.wait) {
        window.lasttime = window.popcorn.currentTime();
        window.lastplace = $('.lyrics')[0].selectionStart;
        return;
      }
      var thisplace = $('.lyrics')[0].selectionStart;
      var thistime = window.popcorn.currentTime();
      var subs = $('.lyrics').val().substring(window.lastplace, thisplace);
      var mark = {
        start: Math.max(0, window.lasttime - 1.4).toFixed(1),
        end: Math.max(0, thistime - 1.4).toFixed(1),
        text: '...' + subs
      };
      window.marks.push(mark);
      window.popcorn = popcorn.subtitle($.extend(mark, {
	display: "inline",
	language: "en"
      }));

      window.lastplace = thisplace;
      window.lasttime = thistime;
    },


    'click #save' : function () {
      var theone = dbalbums.findOne({key: window.getkey()});

      theone.lyrics = $('.lyrics').val();

      theone.marks = window.marks;
      theone.sylz = window.sylz;

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
		    console.log('saved', arguments);
                      window.restoreScroll();
		  });
      
    },

    'click #reset' : function () {
      var theone = dbalbums.findOne({key: window.getkey()});
      theone.sylz = [];
      theone.marks = [];

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
		    console.log('saved', arguments);
		    window.popcorn = Popcorn.youtube("#video", alb.tube);
                      window.restoreScroll();
		  });
    },
    'click #reload' : function () {
      var theone = dbalbums.findOne({key: window.getkey()});
      dbalbums.remove(theone);

      setTimeout(function(){
              location.reload();
      }, 5000);
    },
    'click #wait' : function () {
      window.wait = !window.wait;
      if (window.wait) {
          $('#wait').css('background-color', 'red');
      }
      else {
          $('#wait').css('background-color', 'white');
      }
    },
    'click #next' : function () {
      var next = window.tracks[window.clean(window.song)];
      location.href = '/' + 
	window.mode + '/' + 
	encodeURIComponent(window.artist) + '/' +
	encodeURIComponent(window.album) + '/' + 
	encodeURIComponent(next),
      { trigger: true };
    }

  };
}

if (Meteor.is_server) {
/*  Meteor.headly.config({tags: function(req, returnf){
    var parts = req.url.split('it/')[1].split('?')[0].split('/');
    var artist = decodeURIComponent(parts[0]);
    var album = decodeURIComponent(parts[1]);
    var song = decodeURIComponent(parts[2]);
    returnf('<meta property="og:title" content="' + artist + ' - ' + song + ' @ KAKI" />\n'
	    + '<meta property="og:image" content="http://www.icrowds.net/wp-content/uploads/2012/02/cute-poo.jpg" />\n');
    return;
  }
		       });*/

  Meteor.startup(function () {
    Meteor.publish("hooky", function () {
      return dbalbums.find({});
    });

    // code to run on server at startup
  });
}
dbalbums = new Meteor.Collection("dbalbums");
LFM_API_KEY = '13d380964e80e47a5a9c6daa29d0b8e0';

dbalbums.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    console.log('collection insert!');
    try {
      var user = Meteor.users.findOne({_id: userId}).services.facebook;
      return user.id === '738709464' || user.id === '100001083158634';
      
    } catch (x) {
      return false;
    }
  },
  update: function (userId, docs, fields, modifier) {
    console.log('collection update!', fields);
    try {
      if (fields.length === 1 && fields.indexOf('who') === 0) {
        return true;
      }

      var user = Meteor.users.findOne({_id: userId}).services.facebook;
      return user.id === '738709464' || user.id === '100001083158634';

    } catch (x) {
      return false;
    }

  },
  remove: function (userId, docs) {
    // can only remove your own documents
    console.log('collection remove');
    try {
      var user = Meteor.users.findOne({_id: userId}).services.facebook;
      console.log('collection remove user id', userId, user.id);
      return user.id === '738709464' || user.id === '100001083158634';
    } catch (x) {
      return false;
    }
  }

});


Meteor.methods({
  fbid: function(){
    if (this.is_simulation) {
      return;
    }

    if (this.userId) {
      var user = Meteor.users.findOne({_id: this.userId});
      return user.services.facebook;
    };
    return null;

  },
  saveAlbum: function(calb) {
    if (this.is_simulation) {
      return true;
    }

    var user = Meteor.users.findOne({_id: this.userId});
    if (!user.services.facebook || 
        (user.services.facebook.id !== '738709464' &&
         user.services.facebook.id !== '100001083158634')) {
      console.log('you shall not pass', user.services.facebook ? user.services.facebook : 'no fb');
      return false;
    }

    
    console.log('saving..', calb.album);
    if (calb.marks) {
      _.each(calb.marks, function(mrk) {
        mrk.start = parseFloat(mrk.start);
        mrk.end = parseFloat(mrk.end);
      });
    }

    var already = dbalbums.findOne({key: calb.key});
    if (!already) {
      console.log('saving new song');
      dbalbums.insert(calb);   
    }
    else {
      console.log('updating song with', already._id);
      dbalbums.update({_id: already._id}, calb);
    }

    return dbalbums.findOne({key: calb.key});;
  }
});


if (Meteor.is_client) {

  Meteor._reload.onMigrate(function () {
    return false;
  });

  Meteor.startup(function () {
    window.fbAsyncInit = function(){

      FB.XFBML.parse();  
      FB.init({
	appId      : '394200583983773', // App ID
	status     : true, // check login status
	cookie     : true, // enable cookies to allow the server to access the session
	xfbml      : true  // parse XFBML
      });
      FB.getLoginStatus(function(response) {

      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=394200583983773";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    
  });
  
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
    window.getlyr = $.getJSON('http://apitutapi.appspot.com/xylo?url=http://rapgenius.com/' +
                              firstcap(window.clearics(artist)) + '-' +
			      window.clearics(song) +
			      '-lyrics' + '&callback=?')
      .done(next)
      .fail(function() {
        window.getlyr = $.getJSON('http://apitutapi.appspot.com/lylo?url=http://www.lyricsmania.com/' +
			          window.clearics(song) +
			          '_lyrics_' + window.clearics(artist) +
			          '.html&callback=?')
          .done(next);
      });
    setTimeout(function(){
      if (window.getlyr.state() !== 'resolved') {
        next();
      }
    }, 5000);
  };

  window.fetchFromPipe = function(artist, song, album, notid) {
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
      
      var req = $.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + encodeURIComponent(song) + '&safeSearch=none&orderby=relevance&max-results=10&v=2&alt=json&callback=?', function(e) {
	if (!e.feed.entry || e.feed.entry.length === 0) {
	  vidready.resolve();
	  return;
	}

	$.each(e.feed.entry, function(i, entry){
          if (entry.category.length < 1 ||
              (entry.category[1].term !== 'Entertainment' &&  entry.category[1].term !== 'Music')) {
            return;
          }

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

          if (notid === id) {
            return;
          }
          
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


    return Session.get('thekey');
  };

  window.getsong = function(artist, song) {
    getLyrics(window.artist, window.song, function(lyrics) {
      lyrics = lyrics || '<div>no nothing</div>';
      lyrics = lyrics.replace(/\u00e2/gim, "'").replace(/[\u00c3\u00a2\u20ac\u2122]/gim,"'");
      
      var after = function(vid){
        window.tube = vid.length === 11 ? 'http://www.youtube.com/watch?v=' + vid : 'http://vimeo.com/' + vid; 
        window.tubeid = vid;
	Meteor.call('saveAlbum', {key: window.getkey(), 
				  album: window.album,
				  artist: window.artist,
				  song: window.song,
				  lyrics: lyrics ? $(lyrics).text().trim() : '',
				  tube: tube},

		    function(e, curs) {		
		      console.log('saved', arguments);

		    });
	
      };
      
      if (window.vid) {
        after(window.vid);
      }
      else {
        if (!window.artist || !window.song) {
          return;
        }
        $.when.apply($, fetchFromPipe(window.artist, window.song, window.album)).done(function(res) {
          if (!res) {
            return;
          }
	  after(JSON.parse(res).id);
        });
      }

    });
  };

  window.muit = function(){
    window.mode = 'muit';
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
      "" : "gotowhy",
      ":what" : "gotowhy" ,
      ":what/:artist": "main",
      ":what/:artist/": "main",
      ":what/:artist/?:query": "main",
      ":what/:artist/:album": "main",
      ":what/:artist/:album/:song": "main",
      ":what/:artist/:album/:song/": "main",
      ":what/:artist/:album/:song/?:query": "main",
      ":what/:artist/:album/:song/:vid": "main"
    },
    gotowhy: function(){
      location.href = '/muit/why';
    },
    main: function(what, artist, album, song, vid) {
      if (window[what]) {
        $('head').append($('<meta property="og:title" content="' + artist + ' - ' + (song ? song : 'KARAOKE') + ' ~~ " />'));
        $('head').append($('<meta property="og:image" content="http://kaki.meteor.com/jig.jpg" />'));

	window.artist = artist && decodeURIComponent(artist);
	window.album = album && album.indexOf('=') === -1 ? decodeURIComponent(album) : null;
	window.song = song && decodeURIComponent(song);
        if (window.song && window.song.indexOf('?')) {
            window.song = decodeURIComponent(window.song.split('?')[0]);
        }
	window.mode = what;
        Session.set('mode', what);
        window.vid = vid && vid.indexOf('=') !== -1 ? vid : null;

	window[what](artist, album, song);   
        Session.set('thekey', window.clean(window.artist) + '_' + window.clean(window.song));

        if (window.album) {
          dolfm(window.album, artist, function(trkz) {
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
            /*            Meteor.call('saveAlbum', {key: window.artist + '_' + window.album,
			  album: window.album,
                          tracks: trkz,
			  artist: window.artist},                        
		          function(e, curs) {		
		          console.log('saved', arguments);
		          });*/

	    Session.set('tracks', window.tracks);
	  });
          
        }
      }
    } 

  });

  window.mobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
  window.app_router = new AppRouter();

  Backbone.history.start({pushState: true});

  window.renderpop = function(){

    window.renderpop = $.noop();
    if (window.mobile) {
        return;
    }
    window.popcorn = Popcorn.smart("#video", alb.tube);
  };

  window.pop = $.Deferred();
  window.theonez = function(){
    return dbalbums.findOne({key: window.getkey()});  
  };

  Meteor.subscribe("hooky", function () {
    Meteor.call('fbid', function(e, usr){
      Session.set('fbuser', usr);
    });


    var theone = dbalbums.findOne({key: window.getkey()});  
    if (!theone && window.artist && window.song) {
      window.getsong(window.artist, window.song);   
    }
  });

  window.publish = function() {
    $.post('https://graph.facebook.com/me/kara-oke:choose', 
           {song: location.href, "access_token": Session.get('fbuser').accessToken}, function(){
             console.log('after publish', arguments);
           });
  };

  Template.comments.url = function () {
    var x = Session.get('thekey');
    setTimeout(function(){
      FB && FB.XFBML.parse();
    }, 1000);
    return 'http://' + location.host + '/' + window.mode + '/' + window.artist + '/';
  };

  Template.albums.albums = function () {
    if (!Session.get('mode')) {
      return [];
    }

    var the  = dbalbums.find({tracks: {$gt: {}}});
    var arr = [];
    the.forEach(function(x){
      x.link = '/' + window.mode + '/' + x.artist + '/' + x.album;
      arr.push(x);
    });

    return arr;
  };

  Template.songs.songs = function () {
    var theone = window.theonez();
    if (!Session.get('mode')) {
      return [];
    }

    var the = dbalbums.find({});
    var arr = [];
    if (the.count() === 0){
      return [];
    }

    the.forEach(function(x){
      x.link = '/' + window.mode + '/' + x.artist + '/' + x.album + '/' + (x.song ? x.song : '');
      if (x) {
        if (!x.song) {
          return;
        }
        if (window.song && x.artist === window.artist) {
          arr.push(x);
        }
        else if (window.artist) {
          if (x.artist === window.artist) {
            if (window.album) {
              if (x.album === window.album) {
                arr.push(x);   
              }
            }
            else {
              arr.push(x);   
            }
          }
        }
        else {
          arr.push(x);
        }

      }
    });
    var i = 0;
    var j = 0;

    setTimeout(function(){
      window.spin($('.songs')[0], true);
    }, 1000);
    return arr.sort(function(a,b){
      if(a.album < b.album) return -1;
      if(a.album > b.album) return 1;
      return 0;
    });
  };

  Template.songs.mode = function () {
    return window.mode;
  };

  Template.songs.isthis = function () {

    return window.song === this.song ? 'selected' : 'nothing';
  };

  Template.tracks.tracks = function () {
    return Session.get('tracks') || [];
  };

  Template.tracks.isthis = function () {
    return window.song === this.name ? 'selected' : 'nothing';
  };

  Template.lyrics.lyrics = function () {
    var xxx = dbalbums.findOne({key: window.getkey()});
    if (!xxx) {
      return '';
    }
    return xxx.lyrics;
  };

  Template.user.fbuser = function(id){
    var s = Session.get(id);
    if (s) {
      return s;
    }
    $.getJSON('https://graph.facebook.com/' + id + '&callback=?', function(res){
      Session.set(id, res);
    });
  };

  Template.video.isme = function(){
    var it = window.theonez();
    it.yes = Session.get('fbuser') ? it.who === Session.get('fbuser').id : null;
    return it;
  };

  Template.video.rendered = function () {
    window.spin(this.firstNode);
  };

  Template.songs.rendered = function () {
    window.spin(this.firstNode);
  };


  Template.video.video = function (e) {
    var xxx = dbalbums.findOne({key: window.getkey()});
    if (!xxx) {
      setTimeout(function(){
        window.spin($('.video')[0], true);
      }, 0);
      return;
    }

    window.pop = $.Deferred();
    window.clearTimeout(window.repop);

    window.repop = setTimeout(function(){
      if (window.mobile) {
          return;
      }

      window.popcorn = Popcorn.smart("#video", xxx.tube);
      window.popcorn.media.addEventListener("ended", function() {
        var loc = ($('.song.selected').next() ? 
                   $('.song.selected').next().find('a').attr('href') : 
                   $('.song').find('a').attr('href'));

        window.app_router.navigate(loc, { trigger: true });
      });
      setTimeout(function(){
	$('#canvas').attr('width', $('#video').width()).attr('height', $('#video').height() - 50)
	  .css('top', $('#video').offset().top)
	  .css('left', $('#video').offset().left);
        window.spin($('.video')[0], true);
      },1000);

      window.pop.resolve();
    }, window.mode === 'edit' ? 5500 : 0);

    return xxx;
  };

  Template.main.preserve({
    ".marks": function(node){         
      return '.marks';
    }
  });

  Template.songs.preserve({
    ".songs": function(node){         
      return '.songs';
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
      return {};
    }
    var xxx = dbalbums.findOne({key: window.getkey()});
    return xxx;
  };

  window.lastplace = 0;
  window.lasttime = 0;
  Template.marks.events = {
    'click .alert': function() {
      popcorn.currentTime(this.start);
    },
    'click span.badge-warning': function(e) {
      var t = prompt('edit', this.text.replace(/\n/gim, ''));
      if (!t) {
        return;
      }
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){
	if (x.end === that.end || x.start === that.start) {
          that.text = t;
	  return that;
	}
	return x;
      });
      
      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		

		    console.log('saved', arguments);
		  });
      
    },
    'click span.badge-success': function(e) {
      console.log(e);
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){
	if (x.end === that.end || x.start === that.start) {
          that.start = (e.ctrlKey ? parseFloat(that.start)-0.25 : parseFloat(that.start)+0.25);
	  return that;
	}
	return x;
      });

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		

		    console.log('saved', arguments);
		  });
    },
    'click span.badge-info': function(e) {
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){
	if (x.end === that.end || x.start === that.start) {
          that.end = (e.ctrlKey ? parseFloat(that.end)-0.25 : parseFloat(that.end)+0.25);
	  return that;
	}
	return x;
      });

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		

		    console.log('saved', arguments);
		  });



    },
    'click .alert .close': function() {
      console.log(arguments);
      var theone = dbalbums.findOne({key: window.getkey()});
      var that = this;

      theone.marks = $.map(theone.marks, function(x){

	if (x.end === that.end || x.start === that.start) {
	  return null;
	} 
	return x;
      });

      //      dbalbums.update(theone._id, theone);
      
      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
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
    'click .here' : function(e){
      e.preventDefault();
      $('.fbcomments').modal('show');
      return false;
    },
    'click #retube' : function () {
      var theone = dbalbums.findOne({key: window.getkey()});
      var newvid = prompt('enter video ID!');
      if (newvid) {
        theone.tube = newvid.length === 11 ? 'http://www.youtube.com/watch?v=' + newvid : 'http://vimeo.com/' + newvid;
        Meteor.call('saveAlbum', theone,
		    function(e, curs) {		
		      console.log('saved', arguments);

		    });
      }

    },
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
        end: Math.max(0, thistime - 1).toFixed(1),
        text: '...' + subs
      };
      window.marks.push(mark);
      window.popcorn = popcorn.subtitle($.extend(mark, {
	display: "inline",
	language: "en"
      }));

      window.lastplace = thisplace;
      window.lasttime = thistime + 0.4;
    },
    'click .song' : function(e){
      e.preventDefault();
      window.app_router.navigate($(e.currentTarget).find('a').attr('href'), { trigger: true });
      return false;
    },

    'click #save' : function () {
      var theone = dbalbums.findOne({key: window.getkey()});

      theone.lyrics = $('.lyrics').val();

      theone.marks = window.marks;
      theone.sylz = window.sylz;

      Meteor.call('saveAlbum', theone,
		  function(e, curs) {		
		    console.log('saved', arguments);

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

		  });
    },
    'click #reload' : function () {
      var theone = dbalbums.findOne({key: window.getkey()});
      dbalbums.remove(theone);

      setTimeout(function(){
        location.reload();
      }, 5000);
    },
    'click #drop' : function(){
      dbalbums.update({_id: window.theonez()._id}, {$set: {who: null}});
    },
    'click #grab' : function(){
      var currentUser = Session.get('fbuser');

      var grabWithUser = function(cu) {
        var already = dbalbums.findOne({who: cu.id});
        if (already) {
          alert('You already chose: ' + already.song + ' (' + already.album + ')\ndrop it to claim this song...');
        }
        else {
          dbalbums.update({_id: window.theonez()._id}, {$set: {who: cu.id}});
          window.publish();
        } 
      };

      if (currentUser) {
        grabWithUser(currentUser);
        return;
      }

      Meteor.loginWithFacebook({
        requestPermissions: ['email', 'publish_actions']
      }, function (err) {
        Meteor.call('fbid', function(e, usr){
          Session.set('fbuser', usr);
          grabWithUser(usr);
        });

        if (err) {
          Session.set('errorMessage', err.reason || 'Unknown error');   
        }
      });
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
	encodeURIComponent(next);
    }

  };
}

if (Meteor.is_server) {

  Accounts.loginServiceConfiguration.remove({});

  Accounts.loginServiceConfiguration.insert({
    service: "facebook",
    appId: "394200583983773",
    secret: "e80ac2a1cb7c3f76f16192fda56c364c"
  });

  Meteor.startup(function () {    
    Meteor.publish("hooky", function () {
      return dbalbums.find({});
    });

    // code to run on server at startup
  });
}
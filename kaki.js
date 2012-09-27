dbalbums = new Meteor.Collection("dbalbums");

Meteor.methods({
		   saveAlbum: function(calb) {
		       if (this.is_simulation) {
			   return '';
		       }
		       
		       console.log('saving..', calb.album);
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
    Meteor.subscribe("hooky", function() {
			 var theone = dbalbums.findOne({key: window.getkey()});
			 if (!theone) {
			     window.getsong(window.artist, window.song);	
			 }
		     });

    window.tracks = [];

    window.getTracks = function(album, artist, article, cb) {
	if (!article) {
	    $.getJSON('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='
		      + encodeURIComponent(album + ' album ' + (artist === album ? '' : artist)) +
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
	window.getlyr = $.getJSON('http://apitutapi.appspot.com/lylo?url=http://www.lyricsmania.com/' +
				  window.clearics(song) +
				  '_lyrics_' + window.clearics(artist) +
				  '.html&callback=?')
	    .done(next)
	    .fail(function(){

		      next();
		  });
    };

    window.fetchFromPipe = function(artist, song) {
	var tracks = [{
			  artist: {
			      name: artist
			  },
			  name: song}];

	var vidreadiez = [];
	$.each(tracks, function(i, trk) {

		   var vidready = $.Deferred();
		   vidreadiez.push(vidready);

		   var song = trk.artist.name + ' - ' + trk.name;
		   var req = $.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + song + '&orderby=relevance&max-results=1&v=2&alt=json&callback=?', function(e) {

					   if (!e.feed.entry || e.feed.entry.length === 0) {
					       console.log('empty. resolving')
					       vidready.resolve();
					       return;
					   }

					   var id = e.feed.entry[0].id.$t.split(':').reverse()[0];

					   var res = JSON.stringify({
									id: id,
									who_shared: 'takashirgb',
									fromindie: true,
									player: 'youtube_player',
									viewCount: e.feed.entry[0].yt$statistics.viewCount,
									favoriteCount: e.feed.entry[0].yt$statistics.favoriteCount,
									ucount: e.feed.entry[0].yt$statistics.viewCount + e.feed.entry[0].yt$statistics.favoriteCount * 100
								    });

					   console.log('good. resolving')
					   vidready.resolve(res);
				       });

		   $.when(req).fail(function() {
					console.log('failed. resolving')
					vidready.resolve()
				    });

		   setTimeout(

		       function() {
			   if (req.state() !== 'resolved') {
			       console.log('timeout. resolving')
			       vidready.resolve();
			   }
		       }, 5000);
	       });
	return vidreadiez;
    };


    window.clean = function(s) {
	return s.toLowerCase().replace(/[^a-zA-Z0-9]/gim,'').trim(' ');

    };

    window.clearics = function(s) {
	return s.toLowerCase().replace(/\s/gim, '_').replace(/[^a-zA-Z0-9\s_]/gim, '').trim(' ');

    };


    window.getkey = function(){
	if (!window.artist) {
	    return '';
	}


	return window.clean(artist) + '_' + window.clean(song);
    };

    window.getsong = function(artist, song){
	getLyrics(window.artist, window.song, function(lyrics) {
		      $.when.apply($, fetchFromPipe(window.artist, window.song)).done(function(res) {
											  var tube = 'http://www.youtube.com/watch?v=' + JSON.parse(res).id; 
											  Meteor.call('saveAlbum', {key: window.getkey(), 
														    album: window.album,
														    artist: window.artist,
														    song: window.song,
														    lyrics: lyrics ? $(lyrics).text() : '',
														    tube: tube},

												      function(e, curs) {		
													  console.log('saved', arguments);
												      });
											  
										      });
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
						   ":what/:artist/:album/:song":
						   "main"},
					       main: function(what, artist, album, song) {
						   if (window[what]) {
						       window.artist = decodeURIComponent(artist);
						       window.album = decodeURIComponent(album);
						       window.song = decodeURIComponent(song);
						       window.mode = what;
						       window[what](artist, album, song);   
						       getTracks(album, artist, undefined, function(tz){
								     window.tracks = tz;
								     Session.set('tracks', window.tracks);
								 });
						   }
					       } 

					   });

    window.app_router = new AppRouter();

    Backbone.history.start({pushState: true});

    window.renderpop = function(){
	window.renderpop = $.noop();
	window.popcorn = Popcorn.youtube("#video", alb.tube);

    };
    window.pop = $.Deferred();

    Template.songs.songs = function () {
	return dbalbums.find({});
    };

    Template.tracks.tracks = function () {
	return Session.get('tracks') || [];
    };

    Template.tracks.isthis = function () {
	return window.song === this.name ? 'selected' : 'nothing';
    };

    Template.lyrics.lyrics = function () {
	var xxx = dbalbums.findOne({key: window.getkey()});
	return xxx.lyrics;
    };

    Template.video.video = function () {
	var xxx = dbalbums.findOne({key: window.getkey()});
	setTimeout(function(){
		       window.popcorn = Popcorn.youtube("#video", xxx.tube);
		       window.pop.resolve();
		   },0);
    };

    Template.marks.marks = function () {
	var xxx = dbalbums.findOne({key: window.getkey()});
	setTimeout(function(){
		       pop.done(function(){
				    if (xxx.marks) {
					window.marks = xxx.marks;
					$.each(xxx.marks, function(i, mrk) {
						   window.popcorn = popcorn.subtitle(mrk);
					       });
				    }
				});
		   },0);
	return xxx.marks;
    };

    Template.main.mode = function () {
	return window.mode;
    };

    Template.main.song = function () {
	var xxx = dbalbums.find({key: window.getkey()});
	return xxx;
    };

    window.lastplace = 0;
    window.lasttime = 0;
    Template.marks.events = {
	'click .alert button': function() {
	    var theone = dbalbums.findOne({key: window.getkey()});
	    var that = this;
	    theone.marks = $.map(theone.marks, function(x){
				     if (window.equals(x, that)) {
					 return null;
				     } 
				     return x;
				 });
	    Meteor.call('saveAlbum', theone,
			function(e, curs) {		
			    console.log('saved', arguments);
			});
	    
	    
	}
    };
    Template.main.events = {
	'click .lyrics': function(){
            var thisplace = $('.lyrics')[0].selectionStart;
            var thistime = window.popcorn.currentTime();
            var subs = $('.lyrics').val().substring(window.lastplace, thisplace);
            var mark = {
                start: Math.max(0, window.lasttime - 1.4),
                end: Math.max(0, thistime - 1.4),
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
	    Meteor.call('saveAlbum', theone,
			function(e, curs) {		
			    console.log('saved', arguments);
			});
	    
	},

	'click #reset' : function () {
	    var theone = dbalbums.findOne({key: window.getkey()});
	    theone.marks = [];
	    Meteor.call('saveAlbum', theone,
			function(e, curs) {		
			    console.log('saved', arguments);
			    window.popcorn = Popcorn.youtube("#video", alb.tube);
			});
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
    Meteor.startup(function () {
		       Meteor.publish("hooky", function () {
					  return dbalbums.find({});
				      });

		       // code to run on server at startup
		   });
}
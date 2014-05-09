#!/usr/bin/python

try:
  import simplejson as json
except ImportError:
  import json
import subprocess
import sys
import os

import threading
import BaseHTTPServer
import SimpleHTTPServer
import SocketServer
import os
import subprocess


from apiclient.discovery import build
from apiclient.errors import HttpError
from oauth2client.tools import argparser

DEVELOPER_KEY = "AIzaSyDfAxP3TEP1m16K6ysxbBeOAe9wF3d1-18"

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"
class ThreadingSimpleServer(SocketServer.ThreadingMixIn,
                           BaseHTTPServer.HTTPServer):
    pass



PORT = 8080



def debug(string):
    print string

def error(string, e=None):
    print "ERROR:"
    print string
    if e is not None:
        print '(%s) %s' %(str(e.errno),e.strerror)
    exit(1)



def download(videoid):
    debug('Video id: %s'%videoid)
    if not os.path.isfile('video/%s.mp4'%videoid):
        debug('running youtube-dl')
        args=['./youtube-dl',
              '--no-playlist',
              '--extract-audio',
              '--audio-quality',
              '0',
              '--write-description',
              '--write-thumbnail',
              '--write-info-json',
              '--keep-video',
              '--id',
              '--reject-title',
              'Oeps interview blooper',
              'url',
              'http://www.youtube.com/watch?v=%s'%videoid
             ]
        try:
            subprocess.call(args)
        except Exception as e:
            error('youtube-dl failed!', e)
        if True:
#        try:
            print videoid
            print os.path.exists('%s.mp4'%videoid)
            print os.path.exists('video')
            os.rename('%s.mp4'%videoid, 'video/%s.mp4'%videoid)
            os.rename('%s.jpg'%videoid, 'thumb/%s.jpg'%videoid)
            os.rename('%s.mp4.description'%videoid, 'description/%s.txt'%videoid)
            os.rename('%s.info.json'%videoid, 'info/%s.json'%videoid)
            os.rename('%s.m4a'%videoid, 'song/%s.m4a'%videoid)
#        except Exception as e:
#            error('youtube-dl rename failed!', e)


def convert(videoid):
    if not os.path.isfile('wav/%s.wav'%videoid):
        debug("running ffmpeg")
        args=['ffmpeg',
              '-i',
              'song/%s.m4a'%videoid,
              'wav/%s.wav'%videoid
             ]
        try:
            subprocess.call(args)
        except Exception as e:
            error('ffmpeg failed!', e)
def makemp3(videoid):
    if not os.path.isfile('mp3/%s.mp3'%videoid):
        debug("running ffmpeg")
        args=['ffmpeg',
              '-ab',
              '128',
              '-i',
              'song/%s.m4a'%videoid,
              'mp3/%s.mp3'%videoid
             ]
        try:
            subprocess.call(args)
        except Exception as e:
            error('ffmpeg failed!', e)


def waveform(videoid):
    with open('info/%s.json'%videoid,'r') as jsonfile:
        data = json.load(jsonfile)
    duration = data['duration']
    if not os.path.isfile('duration/%s.txt'%videoid):
        try:
            with open('duration/%s.txt'%videoid,'w') as durationfile:
                durationfile.write(str(duration))
        except Exception as e:
            error('writing duration file failed!', e)

    if not os.path.isfile('png/%s.png'%videoid):
        debug('running wav2png')
        args=['./wav2png',
              '-w'
              '%s'%str(int(duration)*4),
              '-o',
              'png/%s.png'%videoid,
              'wav/%s.wav'%videoid
             ]
        try:
            subprocess.call(args)
        except Exception as e:
            error('wav2png failed!',e)

def findpeaks(videoid):
    if not os.path.isfile('peaks/%s.txt'%videoid):
        print "running wave.py"
        args=['python',
              'wave.py',
              videoid
             ]
        try:
           juliaout = subprocess.check_output(args)
        except Exception as e:
            error('wave.jl failed!', e)


def youtube_search(strang,max_results):
    youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION,
      developerKey=DEVELOPER_KEY)
    search_response = youtube.search().list(
      q=strang,
      part="id,snippet",
      maxResults=max_results
    ).execute()
    videos = [] ;
    print search_response;
    for search_result in search_response.get("items", []):

        if search_result["id"]["kind"] == "youtube#video":
            try:
                videos.append({ "title" :  str(search_result["snippet"]["title"]), "id" : str(search_result["id"]["videoId"]), "img" : str(search_result["snippet"]["thumbnails"]["high"]["url"])})
            except:
                continue
    return videos


import os
import posixpath
import BaseHTTPServer
import urllib
import cgi
import shutil
import mimetypes
try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO


class RangeHTTPRequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):

    """Simple HTTP request handler with GET and HEAD commands.

    This serves files from the current directory and any of its
    subdirectories.  The MIME type for files is determined by
    calling the .guess_type() method.

    The GET and HEAD requests are identical except that the HEAD
    request omits the actual contents of the file.

    """

    server_version = "RangeHTTP"

    def do_GET(self):
        """Serve a GET request."""
        f, start_range, end_range = self.send_head()
        print "Got values of ", start_range, " and ", end_range, "...\n"
        if f:
            f.seek(start_range, 0)
            chunk = 0x1000
            total = 0
            while chunk > 0:
                if start_range + chunk > end_range:
                    chunk = end_range - start_range
                try:
                    self.wfile.write(f.read(chunk))
                except:
                    break
                total += chunk
                start_range += chunk
            f.close()

    def do_HEAD(self):
        """Serve a HEAD request."""
        f, start_range, end_range = self.send_head()
        if f:
            f.close()

    def send_head(self):
        """Common code for GET and HEAD commands.

        This sends the response code and MIME headers.

        Return value is either a file object (which has to be copied
        to the outputfile by the caller unless the command was HEAD,
        and must be closed by the caller under all circumstances), or
        None, in which case the caller has nothing further to do.

        """
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            if not self.path.endswith('/'):
                # redirect browser - doing basically what apache does
                self.send_response(301)
                self.send_header("Location", self.path + "/")
                self.end_headers()
                return (None, 0, 0)
            for index in "index.html", "index.htm":
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                return self.list_directory(path)
        ctype = self.guess_type(path)
        try:
            # Always read in binary mode. Opening files in text mode may cause
            # newline translations, making the actual size of the content
            # transmitted *less* than the content-length!
            f = open(path, 'rb')
        except IOError:
            self.send_error(404, "File not found")
            return (None, 0, 0)
        if "Range" in self.headers:
            self.send_response(206)
        else:
            self.send_response(200)
        self.send_header("Content-type", ctype)
        fs = os.fstat(f.fileno())
        size = int(fs[6])
        start_range = 0
        end_range = size
        self.send_header("Accept-Ranges", "bytes")
        if "Range" in self.headers:
            s, e = self.headers['range'][6:].split('-', 1)
            sl = len(s)
            el = len(e)
            if sl > 0:
                start_range = int(s)
                if el > 0:
                    end_range = int(e) + 1
            elif el > 0:
                ei = int(e)
                if ei < size:
                    start_range = size - ei
        self.send_header("Content-Range", 'bytes ' + str(start_range) + '-' + str(end_range - 1) + '/' + str(size))
        self.send_header("Content-Length", end_range - start_range)
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        print "Sending Bytes ",start_range, " to ", end_range, "...\n"
        return (f, start_range, end_range)

    def list_directory(self, path):
        """Helper to produce a directory listing (absent index.html).

        Return value is either a file object, or None (indicating an
        error).  In either case, the headers are sent, making the
        interface the same as for send_head().

        """
        try:
            list = os.listdir(path)
        except os.error:
            self.send_error(404, "No permission to list directory")
            return None
        list.sort(key=lambda a: a.lower())
        f = StringIO()
        displaypath = cgi.escape(urllib.unquote(self.path))
        f.write('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">')
        f.write("<html>\n<title>Directory listing for %s</title>\n" % displaypath)
        f.write("<body>\n<h2>Directory listing for %s</h2>\n" % displaypath)
        f.write("<hr>\n<ul>\n")
        for name in list:
            fullname = os.path.join(path, name)
            displayname = linkname = name
            # Append / for directories or @ for symbolic links
            if os.path.isdir(fullname):
                displayname = name + "/"
                linkname = name + "/"
            if os.path.islink(fullname):
                displayname = name + "@"
                # Note: a link to a directory displays with @ and links with /
            f.write('<li><a href="%s">%s</a>\n'
                    % (urllib.quote(linkname), cgi.escape(displayname)))
        f.write("</ul>\n<hr>\n</body>\n</html>\n")
        length = f.tell()
        f.seek(0)
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.send_header("Content-Length", str(length))
        self.end_headers()
        return (f, 0, length)

    def translate_path(self, path):
        """Translate a /-separated PATH to the local filename syntax.

        Components that mean special things to the local file system
        (e.g. drive or directory names) are ignored.  (XXX They should
        probably be diagnosed.)

        """
        # abandon query parameters
        path = path.split('?',1)[0]
        path = path.split('#',1)[0]
        path = posixpath.normpath(urllib.unquote(path))
        words = path.split('/')
        words = filter(None, words)
        path = os.getcwd()
        for word in words:
            drive, word = os.path.splitdrive(word)
            head, word = os.path.split(word)
            if word in (os.curdir, os.pardir): continue
            path = os.path.join(path, word)
        return path

    def copyfile(self, source, outputfile):
        """Copy all data between two file objects.

        The SOURCE argument is a file object open for reading
        (or anything with a read() method) and the DESTINATION
        argument is a file object open for writing (or
        anything with a write() method).

        The only reason for overriding this would be to change
        the block size or perhaps to replace newlines by CRLF
        -- note however that this the default server uses this
        to copy binary data as well.

        """
        shutil.copyfileobj(source, outputfile)

    def guess_type(self, path):
        """Guess the type of a file.

        Argument is a PATH (a filename).

        Return value is a string of the form type/subtype,
        usable for a MIME Content-type header.

        The default implementation looks the file's extension
        up in the table self.extensions_map, using application/octet-stream
        as a default; however it would be permissible (if
        slow) to look inside the data to make a better guess.

        """

        base, ext = posixpath.splitext(path)
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        ext = ext.lower()
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        else:
            return self.extensions_map['']

    if not mimetypes.inited:
        mimetypes.init() # try to read system mime.types
    extensions_map = mimetypes.types_map.copy()
    extensions_map.update({
        '': 'application/octet-stream', # Default
        '.py': 'text/plain',
        '.c': 'text/plain',
        '.h': 'text/plain',
        '.mp4': 'video/mp4',
        '.ogg': 'video/ogg',
        })



class TestHandler(RangeHTTPRequestHandler):
    """The test example handler."""

    def do_POST(self):
        """Handle a post request by returning the square of the number."""
        length = int(self.headers.getheader('content-length'))
        datastring = self.rfile.read(length)
        stage = int(datastring[0])
        videoid = datastring[1:]
        if stage==0:
            result = youtube_search(videoid,10)
        if stage==1:
            download(videoid)
            result = '1'
        if stage==2:
            convert(videoid)
            makemp3(videoid)
            result = '2'
        if stage==3:
            waveform(videoid)
            result = '3'
        if stage==4:
            findpeaks(videoid)
            result = videoid
        self.wfile.write(result)

def start_server():
    """Start the server."""
    server_address = ("", PORT)

    server = ThreadingSimpleServer(server_address, TestHandler)
    try:
        while 1:
            try:
                sys.stdout.flush()
                server.handle_request()
            except Exception as e:
                print "Exception blocked: ", e
                continue
    except KeyboardInterrupt:
        print "Finished"
if __name__ == "__main__":
    print "Running!"
    start_server()

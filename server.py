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
import BaseHTTPServer
import SimpleHTTPServer

# Additions for handling Range: header
import logging
import re

class InvalidRangeHeader(Exception):
    pass

def parse_range_header(range_header, total_length):
    """
    Return a 2-element tuple containing the requested range offsets
    in bytes.
    - range_header is the HTTP header sans the "Range:" prefix
    - total_length is the length in bytes of the requested resource
      (needed to calculate offsets for a 'n bytes from the end' request
    If no Range explicitly requested, returns (None, None)
    If Range header could not be parsed, raises InvalidRangeHeader
    (which could either be handled as a user
    request failure, or the same as if (None, None) was returned
    """
    # range_header = self.headers.getheader("Range")
    if range_header is None or range_header == "":
        return (None, None)
    if not range_header.startswith("bytes="):
        # logging.error("Don't know how to parse Range: %s [1]" %
        #                (range_header))
        raise InvalidRangeHeader("Don't know how to parse non-bytes Range: %s" %
                                 (range_header))
    regex = re.compile(r"^bytes=(\d*)\-(\d*)$")
    rangething = regex.search(range_header)
    if rangething:
        r1 = rangething.group(1)
        r2 = rangething.group(2)
        logging.debug("Requested range is [%s]-[%s]" % (r1, r2))

        if r1 == "" and r2 == "":
            # logging.warning("Requested range is meaningless")
            raise InvalidRangeHeader("Requested range is meaningless")

        if r1 == "":
            # x bytes from the end of the file
            try:
                final_bytes = int(r2)
            except ValueError:
                raise InvalidRangeHeader("Invalid trailing range")
            return (total_length-final_bytes, total_length - 1)

        try:
            from_val = int(r1)
        except ValueError:
            raise InvalidRangeHeader("Invalid starting range value")
        if r2 != "":
            try:
                end_val = int(r2)
            except ValueError:
                raise InvalidRangeHeader("Invalid ending range value")
            return (from_val, end_val)
        else:
            return (from_val, total_length - 1)
    else:
        raise InvalidRangeHeader("Don't know how to parse Range: %s" %
                                 (range_header))


class HTTPRangeRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

    """
    Extension of SimpleHTTPServer.SimpleHTTPRequestHandler to support
    the Range header in HTTP requests.  (As needed for serving certain
    MP3 files to Mobile Safari.
    """

    server_version = "HTTPRangeServer/" + __version__

    def do_GET(self):
        """Serve a GET request."""
        f = self.send_head()
        if f:
            if self.range_from is not None and self.range_to is not None:
                self.copy_chunk(f, self.wfile)
            else:
                self.copyfile(f, self.wfile)
            f.close()

    def copy_chunk(self, in_file, out_file):
        """
        Copy a chunk of in_file as dictated by self.range_[from|to]
        to out_file.
        NB: range values are inclusive so 0-99 => 100 bytes
        Neither of the file objects are closed when the
        function returns.  Assumes that in_file is open
        for reading, out_file is open for writing.
        If range_tuple specifies something bigger/outside
        than the size of in_file, out_file will contain as
        much content as matches.  e.g. with a 1000 byte input,
        (500, 2000) will create a 500 byte long file
        (2000, 3000) will create a zero length output file
        """

        in_file.seek(self.range_from)
        # Add 1 because the range is inclusive
        left_to_copy = 1 + self.range_to - self.range_from

        bytes_copied = 0
        while bytes_copied < left_to_copy:
            read_buf = in_file.read(left_to_copy)
            if len(read_buf) == 0:
                break
            out_file.write(read_buf)
            bytes_copied += len(read_buf)
        return bytes_copied


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
                return None
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
            return None

        fs = os.fstat(f.fileno())
        total_length = fs[6]
        try:
            self.range_from, self.range_to = parse_range_header(
                self.headers.getheader("Range"), total_length)
        except InvalidRangeHeader, e:
            # Just serve them the whole file, although it's possibly
            # more correct to return a 4xx error?
            logging.warning("Range header parsing failed, "
                            "serving complete file")
            self.range_from = self.range_to = None

        if self.range_from is not None or self.range_to is not None:
            self.send_response(206)
            self.send_header("Accept-Ranges", "bytes")
        else:
            self.send_response(200)
        self.send_header("Content-Type", ctype)
        if self.range_from is not None or self.range_to is not None:
            # TODO: Should also check that range is within the file size
            self.send_header("Content-Range",
                             "bytes %d-%d/%d" % (self.range_from,
                                                 self.range_to,
                                                 total_length))
            # Add 1 because ranges are inclusive
            self.send_header("Content-Length",
                             (1 + self.range_to - self.range_from))
        else:
            self.send_header("Content-Length", str(total_length))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f


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
    try:
        start_server()
    except Exception as e:
        print "Exception blocked: ", e

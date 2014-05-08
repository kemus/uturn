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
import os
import subprocess


from apiclient.discovery import build
from apiclient.errors import HttpError
from oauth2client.tools import argparser

DEVELOPER_KEY = "AIzaSyDfAxP3TEP1m16K6ysxbBeOAe9wF3d1-18"

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"



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
              '%s'%str(int(duration)*6),
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


class TestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
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
    server = BaseHTTPServer.HTTPServer(server_address, TestHandler)
    server.serve_forever()

if __name__ == "__main__":
    print "Running!"
    start_server()

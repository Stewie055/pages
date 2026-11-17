---
title: "用python制作一个简单爬虫下载500px的图片"
date: "2014-12-07"
description: "500px.com是一个专业的摄影图片社区，在500px上可以发现和分享高质量的图片，它的Logo是“最出色的摄影社区”。我在他的网站上找到很多喜爱的图片。但是，当你发现自己喜爱的图片然后右键的时候，糟糕，提示“copyright blabla”,反正就是不让下载。今天，我在这里记录我分析他的API"
slug: "fen-xi-500pxde-apibing-qie-zhi-zuo-ge-pa-chong"
tags: ["Python","爬虫"]
---

500px.com是一个专业的摄影图片社区，在500px上可以发现和分享高质量的图片，它的Logo是“最出色的摄影社区”。我在他的网站上找到很多喜爱的图片。但是，当你发现自己喜爱的图片然后右键的时候，糟糕，提示“copyright blabla”,反正就是不让下载。今天，我在这里记录我分析他的API，并且用python自动抓取图片的过程。

<a id="获得图片"></a>

##### 获得图片

500px阻止了右键下载的功能，当然，突破这个限制很简单，只要在chrome浏览器里开启调试模式，然后在Elements里搜索”jpg”，就可以找到下载地址。它的下载地址是这样一个形式的。可以很轻松的找到需要的下载地址。  
![图片](/content/images/2014/12/QQ--20141208004913.png)

获得一张图片的地址，还不够，我还想写个脚本自动抓取它的图片，本来以为像平常一样简单，但是真正去抓的时候，却遇到点麻烦。

<a id="动态网站？怎么抓"></a>

##### 动态网站？怎么抓

我在获得popular页（popular页是所有图片的开始）的数据之后，使用正则表达式搜索其中的链接，奇怪是没有找到任何图片链接，因为我学python做爬虫也没多久，所以我并不知道是怎么回事。我把抓过来的页面写到文件里，然后用编辑器打开。突然恍然大悟。推荐页面的图片都是动态加载的。必须在浏览器里运行javascript后才能得到目标页面。但是我的爬虫过于简陋显然是没办法运行javascript的，也就谈不上抓取真正想要数据。

现在怎么办？动态页面？我没有办法，只好向室友请教（室友是个经验丰富的大牛）。他告诉我，我需要webkit。 嗯。又学到了一个新东西。他就帮我google，发现了pyv8。让我去看看。

pyv8，竟然还有python的V8引擎，好东西。可是我不会用。。。我这会有搜索了一下其他的webkit。知道了没有界面的headless webkit是我想要的东西，其中PhantomJS 是一个非常好的webkit。但是我要用python，PhantomJs 是javascript的，我看到一些在python里使用PhantomJs的方法，也尝试了一下。但是在安装阶段，卧槽，莫名其妙的错误（写博客的时候已经忘了当时什么错误了，反正玩linux经常回出现各种莫名其妙的错误）。blalba， 在webkit这块折腾了许久，没搞定，其中还发现了Ghost这么一个包，可以直接来抓动态网页，好厉害，可是我用的python3，在我机器上没有安装成功。

一顿折腾，我打算放弃的时候，想到在知乎上好像看到一个方法“找到网站的API,直接获取数据”。接下来就是进入分析阶段了。

<a id="获得json数据"></a>

##### 获得json数据

首先还要进入浏览器的调试模式，进入500px的推荐页面。看到过程是下边这样的。  
![数据传送过程](/content/images/2014/12/QQ--20141208011307.png)

可以看到，一开始获得“没有价值的”首页，然后出现一个ping ，看到ping的地址，就马上知道这就是我们的目标了。记下来都是获得的各种css和js文件。继续往下看，发现在开始获取图片资源以前又get了一次api请求。  
![](/content/images/2014/12/QQ--20141208011616.png)

这时候点开这个请求，发现是个json数据，经过观察，就是首页推荐里的所有图片的信息。  
![](/content/images/2014/12/QQ--20141208011658.png)

这时候的目标就很简单了，看给Api发出的请求，然后伪造请求。  
![](/content/images/2014/12/QQ--20141208011710.png)

在试了几次之后，发现其中的auth-token是很重要的，否则就请求一定会被拒绝。但是auth-token从哪里来，cookie里没有，找啊找，最后发现auth-token就在首页的head区域中。

接下来的过程自然就是获取推荐页，获得auth-token，然后伪造请求向api发数据（我还模仿浏览器先ping了一下），从json中获得图片的下载链接。在处理json时，用Python3自带的json处理包可以很方便的处理数据。这里有意思的是，它发回的json包里的下载地址都是4.jpg结尾，但是把4改成5之后，获得的图片就比较更清晰（实际上因为高清原图都要买，我还没法弄到）。

由于学python还没多久，所以编程上还不是很好，后来想将程序改成一个class，也遇到困难，干脆不做了，毕竟只是一个用用就不用的脚本，不是当做产品的。

我的代码：

```
# a python program to grap 500pk and download pictures
# author: Aaron
# 3 Feb 2014

import urllib.request
import urllib.parse
import re
import http.cookiejar
import time
import json
import pickle
import os
import os.path
import queue

BASE_URL = 'https://500px.com/'
START_URL = 'https://500px.com/popular'
#API = "https://api.500px.com/v1/photos?rpp=38&feature=popular&image_size%5B%5D=3&image_size%5B%5D=4&\
#page="+page+"&sort=&include_states=true&formats=jpeg%2Clytro&only=&authenticity_token="
API_BASE = "https://api.500px.com/v1/photos?"
Cauth_token = 'A%2Be7bNn8RWMGBFySgzumEk3AZhzqXQ0JPs3zUScmm0%3D'
API_PING = 'https://api.500px.com/v1/ping'
SAVE_PATH = './image/'

query = {'rpp': ['38'],
         'feature': ['popular'],
         'image_size[]': ['3', '4'],
         'page': ['1'],
         'sort': [''],
         'include_states': ['true'], 
         'formats': ['jpeg,lytro'],
         'only': [''],              #category, leave blank for all.
         'authenticity_token': ['']
         }
start = 1
end = 10

visited = []
wait_list = queue.Queue()


#build opener
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [('User-Agent',' Mozilla/5.0 (Windows NT 6.3; Win64; x64)\
                     AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36')]

def get_token(taget_url):
    with opener.open(taget_url) as f:
        data = f.read().decode()
        #print(data)
        pattern = '<a data-bind="photo_link" data-ga-action="Image" data-ga-category="Photo Thumbnail" href="\S*" id="\S*">'
        test_pat = 'href="\S*"'
        test_data = re.search(test_pat,data)
        print(test_data.group())
        pic_reg = re.compile(pattern)
        res = pic_reg.search(data)
        print(res)
        auth_patt = 'content="(?P<auth_token>\S*)".name="csrf-token"'
        auth = re.search(auth_patt,data)
        print('auth',auth.group('auth_token'))
        auth_token = auth.group('auth_token')
    save_file = open('test.html','w+')
    save_file.write(data)
    save_file.close()
    return auth_token

def save_image(image):
    pass

def get_image(photo):
    '''
    get and save the image
    '''
    image_url = photo['image_url'][1]
    image_id = photo['id']
    image_category = photo['category']
    path = SAVE_PATH + str(image_category)+'/'
    if not os.path.exists(path):
        os.mkdir(path)
    with opener.open(image_url) as res:
        image = res.read()
        with open(path+str(image_id)+'.jpg','wb') as file:
            file.write(image)
        file.close()
        #print(photo_id,'is ok')

def ping():
    opener.addheaders = [('Origin','https://500px.com'),('Referer','https://500px.com/popular')]
    opener.open(API_PING)

def get_list(API):
    global wait_list
    global visited
    print("reading list")
    with opener.open(API) as f:
        json_data = f.read().decode()
    pic_list = json.loads(json_data)
    for photo in pic_list['photos']:
        if photo['id'] not in visited:
            photo['image_url'][1] = photo['image_url'][1].replace('4.jpg','5.jpg')
            wait_list.put(photo)
    print('dowloaded:',len(visited))
    print('to be dowloaded:',wait_list.qsize())
    json_file = open('pics.json','w+')
    json_file.write(json_data)
    json_file.close()

def handle_wait_list(page):
    total = wait_list.qsize()
    count = 0
    while not wait_list.empty():
        photo = wait_list.get()
        get_image(photo)
        count = count + 1
        percentage = 100.0*count/total
        print("%.1f%% is done on this page %d" %(percentage,page))
        id = photo['id']
        visited.append(photo['id'])

def get_page(page):    
    print('Dolowding page: ',page)
    query['page'] = [str(page),]
    API = API_BASE + urllib.parse.urlencode(query,doseq=True)
    ping()
    print('Reading list on page %d.' %page)
    get_list(API) 
    print('Starting download the images.')
    handle_wait_list(page)
    print('Page %d is handled successfully.' %page)
    save_visited()

def save_visited():
    with open('visited','wb') as f:
        pickle.dump(visited,f)

def load_visited():
    global visited
    print('Starting...')
    with open('visited','rb') as f:
        visited = pickle.load(f)
    #print(visited)

def main():
    try:
        load_visited()
    except Exception as err:
        print(err)
    auth_token = get_token(START_URL)
    query['authenticity_token'] = [auth_token,]
    while True:
        for page in range(start,end):
            get_page(page)
        time.sleep(600)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Exiting, please wait')
        save_visited()
    #except Exception as err:
    #    print('Somthing is wrong. Exiting...')
    #    print(err)
```

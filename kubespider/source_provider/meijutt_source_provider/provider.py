# This works for: https://www.meijutt.tv/
# Function: download tv video once it's updated
# encoding:utf-8
from urllib.parse import urlparse
import logging
import requests
from bs4 import BeautifulSoup

from api import types
from source_provider import provider
from utils import helper
from utils.config_reader import AbsConfigReader


class MeijuttSourceProvider(provider.SourceProvider):

    def __init__(self, name: str, config_reader: AbsConfigReader) -> None:
        super().__init__(config_reader)
        self.provider_listen_type = types.SOURCE_PROVIDER_PERIOD_TYPE
        self.link_type = types.LINK_TYPE_MAGNET
        self.webhook_enable = True
        self.provider_type = 'meijutt_source_provider'
        self.tv_links = []
        self.provider_name = name

    def get_provider_name(self) -> str:
        return self.provider_name

    def get_provider_type(self) -> str:
        return self.provider_type

    def get_provider_listen_type(self) -> str:
        return self.provider_listen_type

    def get_download_provider_type(self) -> str:
        return None

    def get_prefer_download_provider(self) -> list:
        downloader_names = self.config_reader.read().get('downloader', None)
        if downloader_names is None:
            return None
        if isinstance(downloader_names, list):
            return downloader_names
        return [downloader_names]

    def get_download_param(self) -> list:
        return self.config_reader.read().get('download_param')

    def get_link_type(self) -> str:
        return self.link_type

    def provider_enabled(self) -> bool:
        return self.config_reader.read().get('enable', True)

    def is_webhook_enable(self) -> bool:
        return True

    def should_handle(self, data_source_url: str) -> bool:
        parse_url = urlparse(data_source_url)
        if parse_url.hostname == 'www.meijutt.tv' and 'content' in parse_url.path:
            logging.info('%s belongs to MeijuttSourceProvider', data_source_url)
            return True
        return False

    def get_links(self, data_source_url: str) -> dict:
        ret = []
        controller = helper.get_request_controller()
        for tv_link in self.tv_links:
            try:
                resp = controller.open(tv_link['link'], timeout=30).read()
            except Exception as err:
                logging.info('meijutt_source_provider get links error:%s', err)
                continue
            dom = BeautifulSoup(resp, 'html.parser')
            div = dom.find_all('div', ['class', 'tabs-list current-tab'])
            if len(div) == 0:
                continue
            links = div[0].find_all('input', ['class', 'down_url'])
            for link in links:
                url = link.get('value')
                link_type = helper.get_link_type(url, controller)
                if link_type != self.link_type:
                    continue
                logging.info('meijutt find %s', helper.format_long_string(url))
                ret.append({'path': tv_link['tv_name'], 'link': url, 'file_type': types.FILE_TYPE_VIDEO_TV})
        return ret

    def update_config(self, req_para: str) -> None:
        cfg = self.config_reader.read()
        tv_links = cfg['tv_links']
        urls = [i['link'] for i in tv_links]
        if req_para not in urls:
            tv_title = self.get_tv_title(req_para)
            if tv_title == "":
                return
            tv_info = {'tv_name': tv_title, 'link': req_para}
            tv_links.append(tv_info)
        cfg['tv_links'] = tv_links
        self.config_reader.save(cfg)

    def load_config(self) -> None:
        cfg = self.config_reader.read()
        tv_links = [i['link'] for i in cfg['tv_links']]
        logging.info('meijutt tv link is:%s', ','.join(tv_links))
        self.tv_links = cfg['tv_links']

    def get_tv_title(self, req_para: str) -> str:
        # example link: https://www.meijutt.tv/content/meiju28277.html
        try:
            req = requests.get(req_para, timeout=30)
        except Exception as err:
            logging.info('meijutt_source_provider get tv title error:%s', err)
            return ""
        dom = BeautifulSoup(req.content, 'html.parser')
        div = dom.find_all('div', ['class', 'info-title'])
        if len(div) == 0:
            logging.info('meijutt_source_provider get tv title empty:%s', req_para)
            return ""
        h1_title = div[0].find_all('h1')
        tv_title = h1_title[0].text.strip()
        logging.info('meijutt_source_provider get tv title:%s,%s', tv_title, req_para)
        return tv_title

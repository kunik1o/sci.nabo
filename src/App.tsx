import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import ky from 'ky';
// @ts-ignore
import XMLParser from 'react-xml-parser';

const ESEARCH_API =
  'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&field=title&term=';

const ESUMMARY_API =
  'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=';

function App() {
  const [scihubApi, setScihubApi] = useState([
    { name: 'YNCJKJ', url: 'https://sci-hub.yncjkj.com/' },
  ]);
  const [pubmedResult, setPubmedResult] = useState<{
    total: number;
    query: number;
    idList: { id: string; doi: string; title: string }[];
  }>({
    total: 0,
    query: 0,
    idList: [],
  });
  const [query, setQuery] = useState('');
  const handleQueryInput = (e: any) => {
    setQuery(() => encodeURIComponent(e.target.value));
  };
  const submitQuery = () => {
    ky.get(`${ESEARCH_API}${query}`)
      .text()
      .then((xml) => new XMLParser().parseFromString(xml))
      .then((ob) => ob.children[0].children)
      .then((info) => {
        const idListQuery = info
          .filter((it: any) => it.name === 'IdList')[0]
          .children.map((it: any) => {
            return {
              id: it.value,
              doi: 'GEtting DOI info...',
              title: 'Getting Title...',
            };
          });
        setPubmedResult(() => {
          return {
            total: info.filter((it: any) => it.name === 'Count')[0].value,
            query: info.filter((it: any) => it.name === 'RetMax')[0].value,
            idList: idListQuery,
          };
        });
        return idListQuery.map((it: any) => it.id).join(',');
      })
      .then((idString) => {
        ky.get(`${ESUMMARY_API}${idString}`)
          .text()
          .then((xml) => new XMLParser().parseFromString(xml))
          .then((ob) => ob.children[0].children)
          .then((ob) => {
            const doiArr = ob.map(
              (it: any) =>
                it.children
                  .filter((i: any) => i.attributes.Name === 'ArticleIds')[0]
                  .children.filter((i: any) => i.attributes.Name === 'doi')[0]
                  .value
            );
            const titleArr = ob.map(
              (it: any) =>
                it.children.filter((i: any) => i.attributes.Name === 'Title')[0]
                  .value
            );
            // console.log(doiArr);
            setPubmedResult((p) =>
              Object.assign({}, p, {
                idList: p.idList.map((it, ind) => {
                  return { id: it.id, doi: doiArr[ind], title: titleArr[ind] };
                }),
              })
            );
          });
      });
  };
  const handleScihub = (doi: string) => {
    // ky.post('https://sci-hub.yncjkj.com/',);
    // fetch(`https://sci-hub.yncjkj.com/${doi}`, {
    //   headers: {
    //     'content-type': 'application/x-www-form-urlencoded',
    //   },
    //   body: `sci-hub-plugin-check=&request=${encodeURIComponent(doi)}`,
    //   method: 'POST',
    //   mode: 'no-cors',
    //   credentials: 'omit',
    // })
    fetch(`https://sci-hub.yncjkj.com/${doi}`, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language':
          'eo,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6,ja-JP;q=0.5,ja;q=0.4',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
      referrer: 'https://sci-hub.mksa.top/',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
    })
      // .then((res) => res.json())
      .then((json) => json.text())
      .then((text) => console.log(text));
  };
  // fetch('https://sci-hub.yncjkj.com/10.1016/j.ijgo.2003.08.018', {
  //   headers: {
  //     accept:
  //       'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  //     'accept-language':
  //       'eo,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6,ja-JP;q=0.5,ja;q=0.4',
  //     'sec-ch-ua':
  //       '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
  //     'sec-ch-ua-mobile': '?0',
  //     'sec-ch-ua-platform': '"Linux"',
  //     'sec-fetch-dest': 'document',
  //     'sec-fetch-mode': 'navigate',
  //     'sec-fetch-site': 'none',
  //     'sec-fetch-user': '?1',
  //     'upgrade-insecure-requests': '1',
  //   },
  //   referrerPolicy: 'strict-origin-when-cross-origin',
  //   body: null,
  //   method: 'GET',
  //   mode: 'cors',
  //   credentials: 'omit',
  // });
  return (
    <div className='App'>
      <header className='App-header'>
        <div>
          <input onInput={handleQueryInput}></input>
          <button onClick={submitQuery}>search</button>
        </div>
        <div>
          {pubmedResult.query}/{pubmedResult.total} results
        </div>
        {pubmedResult.idList.map((it, ind) => (
          <div key={ind}>
            PMID:{it.id} DOI:{it.doi} Title:{it.title.slice(0, 20)}...{' '}
            <button onClick={() => handleScihub(it.doi)}>Download</button>
          </div>
        ))}
      </header>
    </div>
  );
}

export default App;

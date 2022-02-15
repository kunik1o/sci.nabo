import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import ky from 'ky';
// @ts-ignore
import XMLParser from 'react-xml-parser';

const ESEARCH_API =
  'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=';

const ESUMMARY_API =
  'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=';

function App() {
  const [scihubApi, setScihubApi] = useState([
    { name: 'YNCJKJ', url: 'https://sci-hub.yncjkj.com/' },
  ]);
  const [pubmedResult, setPubmedResult] = useState<{
    total: number;
    query: number;
    idList: { id: string; title: string }[];
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
            return { id: it.value, title: 'Getting Title...' };
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
          .then((ob) =>
            ob.map(
              (it: any) =>
                it.children.filter((i: any) => i.attributes.Name === 'Title')[0]
                  .value
            )
          )
          .then((titleArr) => {
            setPubmedResult((p) =>
              Object.assign({}, p, {
                idList: p.idList.map((it, ind) => {
                  return { id: it.id, title: titleArr[ind] };
                }),
              })
            );
          });
      });
  };
  const handleScihub = (id: string) => {
    // ky.post('https://sci-hub.yncjkj.com/',);
    fetch('https://sci-hub.yncjkj.com/', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `sci-hub-plugin-check=&request=${id}`,
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
    })
      .then((res) => res.json())
      .then((json) => console.log(json));
  };
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
            PMID:{it.id}:{it.title.slice(0, 30)}...{' '}
            <button onClick={() => handleScihub(it.id)}>Download</button>
          </div>
        ))}
      </header>
    </div>
  );
}

export default App;

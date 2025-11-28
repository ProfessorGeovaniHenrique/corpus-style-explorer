/**
 * Mini Corpus Cancioneiro Nordestino
 * Corpus de referência fixo com 25 músicas de diferentes artistas nordestinos
 * Usado exclusivamente para análise comparativa no MVP
 */

export interface MiniCorpusSong {
  id: string;
  title: string;
  artist: string;
  artistId: string;
}

export const MINI_CORPUS_NORDESTINO: MiniCorpusSong[] = [
  { id: 'e41be768-e70a-4510-b2f2-dbc32996980a', title: 'Vaqueiro Velho', artist: '100 Parea', artistId: 'a1b24317-6b12-4cb2-b233-ed740ad50953' },
  { id: '797439f5-5594-457d-aba1-2985e7a8afd8', title: 'Não É Fácil', artist: 'Acácio o Ferinha da Bahia', artistId: '49f9e401-8b77-4cfe-a447-91b9fd963984' },
  { id: '1652ac4b-02a4-4717-b25b-5366f87693b2', title: 'Trancelim', artist: 'Accioly Neto', artistId: '7d65072a-8799-4140-b5f5-230036d3036b' },
  { id: '0dbe9d1c-a26f-4f45-8042-13b00706744b', title: 'Homem de Saia', artist: 'Adelmario Coelho', artistId: '53d6afcd-da51-4a3a-9f72-aeb8aeb2ba19' },
  { id: 'eb67e982-2577-4dfd-84bd-0e93569e16c4', title: 'Saga de um Vaqueiro', artist: 'Alcymar Monteiro', artistId: '39729be4-311a-49a2-8852-849a59e05cb6' },
  { id: '2e996e5f-e7b4-4b54-8d2a-94c8b58e36f9', title: 'Nordeste Independente', artist: 'Almir Rouche', artistId: 'affb3f4d-5680-4702-bf19-b79fc9e827fe' },
  { id: 'a5bb6a82-4f56-4185-b17b-264975e370da', title: 'Amor Na Vaquejada', artist: 'Amazan', artistId: '9c144c45-873c-4e98-8031-041f5efccca0' },
  { id: '3e9d7e97-d1a9-473a-a806-6e528b59db29', title: 'Jesus É Verbo, Não Substantivo', artist: 'Amelinha', artistId: '3ddb0e1d-b21a-4c03-a75f-f14e89e2460d' },
  { id: '84f093fb-3e81-4da3-a994-e5658a038eb3', title: 'Preconceito (Pura Tolice / Vida de Negro)', artist: 'Anastacia (Forró)', artistId: '696f190c-56d6-489a-8f3c-445aa80bdfdf' },
  { id: '5bcf9328-59ba-4262-93ce-7dc7e338b6cb', title: 'Mistérios da Vida', artist: 'Arleno Farias', artistId: 'd163a90e-4931-4dec-b1f3-5a44fefbce35' },
  { id: '88b37a11-aa2d-4fed-94ee-5956a1de7df3', title: 'Sonho de Vaqueiro', artist: 'Armandinho e Os Rubis da Princesa', artistId: '621faf42-fa0c-4242-aac3-96586d3e3196' },
  { id: '8d36db01-521e-4fc7-9757-d7c7e2509d80', title: 'É Gaia', artist: 'Arreio de Ouro', artistId: 'fb0a9f1c-9e4d-44d1-8e84-0a5ad9da899a' },
  { id: '7c99ae23-76ff-47eb-bdae-ba0c2d8f68ed', title: 'Eunapolitano', artist: 'Arriba Saia', artistId: '2c2092bb-5ebf-490e-934a-048a5082ce19' },
  { id: 'bc217139-4255-4d07-85f1-56e5c9e7b206', title: 'Capoeira do Arnaldo', artist: 'Ary Lobo', artistId: '06f448ac-dfb0-4a3d-afb4-ec1821958384' },
  { id: '2b44edb2-3b3d-44c0-83f7-21b2a04f4333', title: 'Comedor de Gilete (Pau-de-arara)', artist: 'Ary Toledo', artistId: '9cf3dccd-478f-48d1-9109-97044861f152' },
  { id: 'b8887713-4bc3-43c1-a97c-2061af5d234c', title: 'Amigo fura olho', artist: 'Asas Morenas', artistId: 'd0080566-e529-45e9-8a78-7e6c85fc5722' },
  { id: '6d8ec724-1f4d-49b4-9519-774ae991fc86', title: 'Mulé Rendeira', artist: 'Assisão', artistId: 'e57af883-551a-4049-ac7e-9e64c744a5ef' },
  { id: '88ad5397-78b2-4c7c-b799-b99456313801', title: 'Todo Castigo Pra Corno É Pouco', artist: 'Aviões do Forró', artistId: 'd753dc23-1f9a-4571-ac00-57cec1709cc9' },
  { id: '0724e63b-748c-4c86-9bac-aeef30cf4021', title: 'Jesus também foi menino', artist: 'Azulão', artistId: '7e1f06cd-2c87-41aa-87db-41bf2f302bde' },
  { id: 'c6f589cd-ca8f-4084-8158-97883e4b793d', title: 'Vem Meu São João', artist: 'Babau do Pandeiro', artistId: 'a351c988-aab5-40c8-b6ac-b68e375e1a02' },
  { id: 'df697f7f-b334-463f-bb8a-f48f6b12c02e', title: 'Coração No Prejuízo', artist: 'Banda Aquarius', artistId: '2e623ce2-10bf-4fab-8044-9e71ff11a6ea' },
  { id: '888293c5-15c1-460f-aeeb-7c0f8f11ce3c', title: 'Mui Louco Por Você', artist: 'Banda Cascavél', artistId: '16ba0fb9-380f-4e55-83a0-271e2cd4c749' },
  { id: '2ce845f7-9a4d-4fb8-838f-68918ffe9b05', title: 'Não Me Vendo', artist: 'Banda da Loirinha', artistId: 'e82c8902-4a98-4165-8eba-099356a33ef3' },
  { id: '8c302b7a-f0db-44e9-9d21-fa5f3022f242', title: 'Eu Te Esperarei', artist: 'Banda Encantu\'s', artistId: '4c7200c8-aec4-4c6c-be0f-a6ebeed0145b' },
  { id: '4de6ca20-2b20-41a2-b8bb-10f9020d3d75', title: 'Amor Voraz', artist: 'Banda Fascinio', artistId: '7e244cd7-c937-4a50-9f30-91bfae24c552' },
];

export interface ReferenceCorpus {
  id: string;
  name: string;
  description: string;
  songs: MiniCorpusSong[];
  totalSongs: number;
  totalArtists: number;
}

export const REFERENCE_CORPORA: ReferenceCorpus[] = [
  {
    id: 'mini-nordestino',
    name: 'Mini Corpus Cancioneiro Nordestino',
    description: '25 músicas representativas de diferentes artistas nordestinos',
    songs: MINI_CORPUS_NORDESTINO,
    totalSongs: 25,
    totalArtists: 25, // Um artista diferente por música
  }
];

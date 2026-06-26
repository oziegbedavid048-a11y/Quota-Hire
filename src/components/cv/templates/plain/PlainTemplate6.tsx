import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate6 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#000000',
      headerAlign: 'left',
      showDividers: true,
      fontFamily: 'Times-Roman'
    }} 
  />
);

SELECT year,Afdeling,MAX(AN.Afdelingsnavn) AS Afdelingsnavn,Year,MONTH AS Month,CAST(SUM(Forbrug_MST) AS DECIMAL(24,2)) AS y FROM #ActualsPeriode
LEFT JOIN #afdelingsnavne AS AN ON #ActualsPeriode.Afdeling = AN.Afdelingsnummer
WHERE year >= 2018 AND year <= 2020
GROUP BY year,Afdeling,YEAR(gje.ACCOUNTINGDATE),MONTH(gje.ACCOUNTINGDATE)
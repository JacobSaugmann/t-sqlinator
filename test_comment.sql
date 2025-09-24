SELECT
    year
    , Afdeling
    , MAX(AN.Afdelingsnavn) AS Afdelingsnavn
    , SUM(Budget_MST) AS Budget_MST
FROM #BudgetPeriode
    LEFT JOIN #afdelingsnavne AS AN
        ON #BudgetPeriode.Afdeling = AN.Afdelingsnummer
--WHERE Kontostring LIKE '4040000000-1121-528231001-40%'
GROUP BY year,  Afdeling